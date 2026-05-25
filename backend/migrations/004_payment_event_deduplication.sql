-- Add Paystack webhook duplicate protection.
-- Apply manually after 003_seed_sample_products.sql.

alter table payment_events
add column if not exists event_key text;

create unique index if not exists idx_payment_events_provider_event_key
on payment_events(provider, event_key)
where event_key is not null;
