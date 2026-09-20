-- Apply order stock atomically once a payment is confirmed.
-- Apply manually after 007_customer_profiles.sql.

alter table orders
    add column if not exists stock_applied boolean not null default false;

-- Claims the order and decrements stock in one transaction. Returns false when
-- the order was already applied, so repeated Paystack verify calls and webhook
-- retries can never decrement the same order twice.
create or replace function apply_order_stock(p_order_id uuid)
returns boolean
language plpgsql
as $$
begin
    update orders
       set stock_applied = true
     where id = p_order_id
       and stock_applied = false;

    if not found then
        return false;
    end if;

    update products p
       set stock_qty = greatest(p.stock_qty - claimed.total_quantity, 0),
           in_stock = greatest(p.stock_qty - claimed.total_quantity, 0) > 0
      from (
            select product_id, sum(quantity)::int as total_quantity
              from order_items
             where order_id = p_order_id
             group by product_id
           ) as claimed
     where claimed.product_id = p.id;

    return true;
end;
$$;
