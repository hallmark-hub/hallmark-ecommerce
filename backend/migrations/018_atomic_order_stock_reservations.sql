-- Reserve inventory and create order lines in one database transaction.
-- Apply after 017_production_access_and_order_details.sql.
-- Configure a trusted scheduler to call release_expired_order_stock() every few minutes.

alter table orders
    add column if not exists stock_reserved boolean not null default false,
    add column if not exists stock_reservation_expires_at timestamptz,
    add column if not exists stock_applied boolean not null default false;

create or replace function release_expired_order_stock()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    expired record;
    line record;
    released integer := 0;
begin
    for expired in
        select id
          from orders
         where stock_reserved = true
           and stock_reservation_expires_at <= now()
           and payment_status <> 'paid'
         order by id
         for update skip locked
    loop
        for line in
            select product_id, sum(quantity)::integer as quantity
              from order_items
             where order_id = expired.id
             group by product_id
             order by product_id
        loop
            update products
               set stock_qty = stock_qty + line.quantity,
                   in_stock = true
             where id = line.product_id;
        end loop;

        update orders
           set stock_reserved = false
         where id = expired.id;
        released := released + 1;
    end loop;
    return released;
end;
$$;

create or replace function create_order_with_items(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    requested record;
    item jsonb;
    product products%rowtype;
    created orders%rowtype;
    item_total integer;
    computed_total integer := 0;
begin
    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
        raise exception 'At least one order item is required';
    end if;

    perform release_expired_order_stock();

    -- Take product locks in stable order before checking or reserving any item.
    for requested in
        select (entry.value ->> 'product_id')::uuid as product_id
          from jsonb_array_elements(p_items) as entry(value)
         group by (entry.value ->> 'product_id')::uuid
         order by (entry.value ->> 'product_id')::uuid
    loop
        select *
          into product
          from products
         where id = requested.product_id
           and is_active = true
           and checkout_type = 'direct'
         for update;
        if not found then
            raise exception 'One or more products cannot be purchased';
        end if;

        select coalesce(sum((entry.value ->> 'quantity')::integer), 0)::integer
          into item_total
          from jsonb_array_elements(p_items) as entry(value)
         where (entry.value ->> 'product_id')::uuid = requested.product_id;

        if item_total <= 0 or product.stock_qty < item_total then
            raise exception 'Available stock changed; refresh the cart';
        end if;
        computed_total := computed_total + item_total * product.price_pesewas;
    end loop;

    for requested in
        select (entry.value ->> 'product_id')::uuid as product_id,
               sum((entry.value ->> 'quantity')::integer)::integer as quantity
          from jsonb_array_elements(p_items) as entry(value)
         group by (entry.value ->> 'product_id')::uuid
         order by (entry.value ->> 'product_id')::uuid
    loop
        update products
           set stock_qty = stock_qty - requested.quantity,
               in_stock = stock_qty - requested.quantity > 0
         where id = requested.product_id;
    end loop;

    insert into orders (
        reference, customer_name, customer_email, customer_phone,
        company_name, delivery_address, subtotal_pesewas, total_pesewas,
        payment_method, payment_status, order_status, returns_policy,
        accepted_returns_policy, stock_reserved, stock_reservation_expires_at
    ) values (
        p_order ->> 'reference',
        p_order ->> 'customer_name',
        p_order ->> 'customer_email',
        p_order ->> 'customer_phone',
        coalesce(p_order ->> 'company_name', ''),
        p_order ->> 'delivery_address',
        computed_total,
        computed_total,
        (p_order ->> 'payment_method')::payment_method,
        'pending',
        'pending',
        p_order ->> 'returns_policy',
        true,
        true,
        now() + interval '30 minutes'
    )
    returning * into created;

    for item in select value from jsonb_array_elements(p_items)
    loop
        select * into product
          from products
         where id = (item ->> 'product_id')::uuid;

        insert into order_items (
            order_id, product_id, product_name, quantity,
            unit_price_pesewas, line_total_pesewas
        ) values (
            created.id,
            product.id,
            product.name,
            (item ->> 'quantity')::integer,
            product.price_pesewas,
            product.price_pesewas * (item ->> 'quantity')::integer
        );
    end loop;

    return to_jsonb(created);
end;
$$;

create or replace function apply_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    target orders%rowtype;
    line record;
begin
    select * into target from orders where id = p_order_id for update;
    if not found or target.payment_status <> 'paid' or target.stock_applied then
        return false;
    end if;

    if target.stock_reservation_expires_at is not null then
        -- New orders consume stock at reservation time. An expired reservation
        -- may already have been released, so reacquire safely if units remain.
        if target.stock_reserved then
            update orders
               set stock_reserved = false,
                   stock_applied = true
             where id = p_order_id;
            return true;
        end if;

        for line in
            select product_id, sum(quantity)::integer as quantity
              from order_items
             where order_id = p_order_id
             group by product_id
             order by product_id
        loop
            perform 1 from products where id = line.product_id for update;
            if not found or (select stock_qty from products where id = line.product_id) < line.quantity then
                return false;
            end if;
        end loop;

        for line in
            select product_id, sum(quantity)::integer as quantity
              from order_items
             where order_id = p_order_id
             group by product_id
             order by product_id
        loop
            update products
               set stock_qty = stock_qty - line.quantity,
                   in_stock = stock_qty - line.quantity > 0
             where id = line.product_id;
        end loop;

        update orders
           set stock_applied = true
         where id = p_order_id;
        return true;
    end if;

    -- Legacy orders created before reservations still deduct stock on payment.
    for line in
        select product_id, sum(quantity)::integer as quantity
          from order_items
         where order_id = p_order_id
         group by product_id
         order by product_id
    loop
        perform 1 from products where id = line.product_id for update;
        if not found or (select stock_qty from products where id = line.product_id) < line.quantity then
            return false;
        end if;
    end loop;

    for line in
        select product_id, sum(quantity)::integer as quantity
          from order_items
         where order_id = p_order_id
         group by product_id
         order by product_id
    loop
        update products
           set stock_qty = stock_qty - line.quantity,
               in_stock = stock_qty - line.quantity > 0
         where id = line.product_id;
    end loop;

    update orders set stock_applied = true where id = p_order_id;
    return true;
end;
$$;

revoke all on function release_expired_order_stock() from public, anon, authenticated;
revoke all on function create_order_with_items(jsonb, jsonb) from public, anon, authenticated;
grant execute on function release_expired_order_stock() to service_role;
grant execute on function create_order_with_items(jsonb, jsonb) to service_role;
