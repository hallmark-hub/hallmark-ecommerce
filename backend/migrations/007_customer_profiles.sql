-- Add customer profiles linked to Supabase Auth users.
-- Apply manually after 006_fix_product_images.sql.

do $$
begin
    create type customer_role as enum ('customer', 'admin');
exception
    when duplicate_object then null;
end $$;

create table if not exists customer_profiles (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null unique,
    name text not null,
    email text not null unique,
    phone text not null,
    role customer_role not null default 'customer',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint customer_profiles_phone_ghana check (phone ~ '^\+233[0-9]{9}$')
);

create index if not exists idx_customer_profiles_email_phone
on customer_profiles(email, phone);

drop trigger if exists customer_profiles_set_updated_at on customer_profiles;
create trigger customer_profiles_set_updated_at
before update on customer_profiles
for each row execute function set_updated_at();
