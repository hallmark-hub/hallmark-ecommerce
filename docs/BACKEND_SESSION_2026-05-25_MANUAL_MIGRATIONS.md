# Backend Session: Manual Migrations

Date: 2026-05-25

## Scope

Added manual SQL migrations under `backend/migrations/` for Supabase/Postgres:

- `001_initial_schema.sql`
- `002_seed_categories.sql`
- `003_seed_sample_products.sql`
- `README.md` with copy/paste execution order

## Notes

- Migrations are intended for manual execution in Supabase SQL Editor because
  Render free tier will not run migration jobs automatically.
- These files were not executed locally or against Supabase.
- Schema follows `docs/API_CONTRACT.md` for catalog, orders, quote requests,
  Paystack/bank-transfer payment records, Ghana phone constraints, return policy
  acceptance, and nullable quote pricing.

## Verification

Run:

```bash
cd backend
python -m pytest -x -q
```

Result: `13 passed in 0.57s`
