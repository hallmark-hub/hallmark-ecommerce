-- Store the business context required to scope a ChefWare project quote.

alter table quote_requests
    add column if not exists company_name text,
    add column if not exists location text,
    add column if not exists quantity text,
    add column if not exists preferred_delivery_date date;
