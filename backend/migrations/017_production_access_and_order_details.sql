-- Production access controls and durable checkout fulfillment details.
-- Review and apply manually in order after confirming migration 016 is live.
-- This intentionally keeps all customer-facing data access behind the FastAPI service role.

alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table quote_requests enable row level security;
alter table quote_request_products enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table customer_profiles enable row level security;
alter table site_content enable row level security;

revoke all on table categories, products, orders, order_items,
    quote_requests, quote_request_products, payments, payment_events,
    customer_profiles, site_content
from public, anon, authenticated;

grant all on table categories, products, orders, order_items,
    quote_requests, quote_request_products, payments, payment_events,
    customer_profiles, site_content
to service_role;

alter table orders
    add column if not exists company_name text not null default '',
    add column if not exists delivery_address text not null default '';

-- The server-side service role is the only caller of stock mutation RPCs.
revoke all on function apply_order_stock(uuid) from public, anon, authenticated;
grant execute on function apply_order_stock(uuid) to service_role;
