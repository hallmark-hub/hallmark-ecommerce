# Backend Production Readiness

Date: 2026-05-25

## Render Backend

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Root directory:

```text
backend
```

Required environment variables:

```text
APP_ENV=production
FRONTEND_URL=https://<frontend-domain>
BACKEND_URL=https://<backend-domain>
SUPABASE_URL=<supabase-project-url>
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
PAYSTACK_SECRET_KEY=<paystack-secret-key>
PAYSTACK_PUBLIC_KEY=<paystack-public-key>
ADMIN_API_KEY=<strong-admin-api-key>
```

Optional until real notifications are enabled:

```text
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=
ADMIN_NOTIFICATION_PHONE=
```

## Supabase Migrations

Render free tier should not be used to run migrations automatically. Apply these
manually in Supabase SQL Editor, in order:

1. `backend/migrations/001_initial_schema.sql`
2. `backend/migrations/002_seed_categories.sql`
3. `backend/migrations/003_seed_sample_products.sql`
4. `backend/migrations/004_payment_event_deduplication.sql`
5. `backend/migrations/005_remove_manual_bank_transfer.sql`
6. `backend/migrations/006_fix_product_images.sql`
7. `backend/migrations/007_customer_profiles.sql`

After applying, verify:

```sql
select slug, checkout_type from categories order by sort_order;
select slug, checkout_type, price_pesewas, price_label from products order by created_at;
```

## Paystack

Set the Paystack webhook URL to:

```text
https://<backend-domain>/api/v1/payments/paystack/webhook
```

The backend validates `x-paystack-signature` using `PAYSTACK_SECRET_KEY`.

## Frontend

Set the frontend API base URL to:

```text
VITE_API_URL=https://<backend-domain>
```

The backend already expects frontend requests from `FRONTEND_URL` through CORS.

Customer and admin sessions use Supabase Auth bearer tokens. Do not expose
`ADMIN_API_KEY` in frontend environment variables; it is only a backend fallback
for emergency/bootstrap access.

## Customer/Admin Accounts

Customers register through:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/me
GET /api/v1/customer/orders
```

Admin dashboard access requires a profile row with:

```sql
update customer_profiles
set role = 'admin'
where email = '<admin-email>';
```

Only run that after the admin user has registered and the profile row exists.

## Known Blockers

- Apply `007_customer_profiles.sql` before enabling customer login in production.
- Create the first admin profile by setting `customer_profiles.role = 'admin'`.
- Remove/deactivate test products and orders from the connected Supabase project before launch.
- Admin quote request listing endpoint is not implemented yet.
- Africa's Talking notification sending is gated and not integrated with real sends yet.

## Verification Before Launch

Run locally before deployment:

```bash
cd backend
python -m pytest -x -q
```

Then test these production endpoints after deploy:

```text
GET /health
GET /api/v1/categories
GET /api/v1/products
POST /api/v1/orders
POST /api/v1/payments/paystack/initialize
POST /api/v1/payments/paystack/webhook
```
