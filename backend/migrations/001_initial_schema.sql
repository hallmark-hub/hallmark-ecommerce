-- ChefWare Enterprise initial schema.
-- Apply manually in Supabase SQL Editor before seed migrations.

create extension if not exists pgcrypto;

do $$
begin
    create type checkout_type as enum ('direct', 'quote');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type payment_method as enum ('paystack', 'bank_transfer');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type payment_status as enum ('pending', 'paid', 'failed');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type order_status as enum ('pending', 'confirmed', 'delivered');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type quote_status as enum ('received', 'contacted', 'quoted', 'closed');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type bank_code as enum ('gcb', 'stanbic');
exception
    when duplicate_object then null;
end $$;

create table if not exists categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text not null default '',
    checkout_type checkout_type not null,
    image_url text not null default '',
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references categories(id) on delete restrict,
    name text not null,
    slug text not null unique,
    description text not null default '',
    checkout_type checkout_type not null,
    price_pesewas integer,
    price_label text,
    images text[] not null default '{}',
    in_stock boolean not null default true,
    stock_qty integer not null default 0,
    tags text[] not null default '{}',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint products_price_non_negative check (
        price_pesewas is null or price_pesewas >= 0
    ),
    constraint products_stock_non_negative check (stock_qty >= 0),
    constraint products_direct_price_required check (
        checkout_type <> 'direct' or price_pesewas is not null
    ),
    constraint products_quote_price_or_label check (
        checkout_type <> 'quote' or price_pesewas is not null or price_label is not null
    )
);

create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    reference text not null unique,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    subtotal_pesewas integer not null,
    total_pesewas integer not null,
    payment_method payment_method not null,
    payment_status payment_status not null default 'pending',
    order_status order_status not null default 'pending',
    returns_policy text not null default 'No refunds. Exchange only within 3 days of purchase.',
    accepted_returns_policy boolean not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint orders_subtotal_non_negative check (subtotal_pesewas >= 0),
    constraint orders_total_non_negative check (total_pesewas >= 0),
    constraint orders_phone_ghana check (customer_phone ~ '^\+233[0-9]{9}$'),
    constraint orders_returns_policy_accepted check (accepted_returns_policy is true)
);

create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid not null references products(id) on delete restrict,
    product_name text not null,
    quantity integer not null,
    unit_price_pesewas integer not null,
    line_total_pesewas integer not null,
    created_at timestamptz not null default now(),
    constraint order_items_quantity_positive check (quantity > 0),
    constraint order_items_unit_price_non_negative check (unit_price_pesewas >= 0),
    constraint order_items_line_total_non_negative check (line_total_pesewas >= 0)
);

create table if not exists quote_requests (
    id uuid primary key default gen_random_uuid(),
    reference text not null unique,
    name text not null,
    email text not null,
    phone text not null,
    category_id uuid not null references categories(id) on delete restrict,
    category_slug text not null,
    message text not null,
    status quote_status not null default 'received',
    notification_attempted boolean not null default false,
    notification_sent boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint quote_requests_phone_ghana check (phone ~ '^\+233[0-9]{9}$')
);

create table if not exists quote_request_products (
    quote_request_id uuid not null references quote_requests(id) on delete cascade,
    product_id uuid not null references products(id) on delete restrict,
    primary key (quote_request_id, product_id)
);

create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    provider payment_method not null,
    reference text not null,
    status payment_status not null default 'pending',
    amount_pesewas integer not null,
    provider_access_code text,
    provider_authorization_url text,
    bank bank_code,
    raw_response jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint payments_amount_non_negative check (amount_pesewas >= 0),
    constraint payments_reference_unique unique (provider, reference)
);

create table if not exists payment_events (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid references payments(id) on delete cascade,
    order_id uuid references orders(id) on delete cascade,
    provider payment_method not null,
    event_type text not null,
    reference text,
    payload jsonb not null default '{}'::jsonb,
    signature_valid boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_category_slug on products(category_id, is_active);
create index if not exists idx_products_search on products using gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);
create index if not exists idx_orders_reference_phone on orders(reference, customer_phone);
create index if not exists idx_quote_requests_reference on quote_requests(reference);
create index if not exists idx_payments_order_id on payments(order_id);
create index if not exists idx_payment_events_reference on payment_events(reference);

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

drop trigger if exists quote_requests_set_updated_at on quote_requests;
create trigger quote_requests_set_updated_at
before update on quote_requests
for each row execute function set_updated_at();

drop trigger if exists payments_set_updated_at on payments;
create trigger payments_set_updated_at
before update on payments
for each row execute function set_updated_at();
