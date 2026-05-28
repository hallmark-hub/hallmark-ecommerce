# Backend Migrations

Manual SQL migrations for ChefWare Enterprise.

Render free tier will not run these automatically. Apply them manually in
Supabase SQL Editor in filename order:

1. `001_initial_schema.sql`
2. `002_seed_categories.sql`
3. `003_seed_sample_products.sql`
4. `004_payment_event_deduplication.sql`
5. `005_remove_manual_bank_transfer.sql`
6. `006_fix_product_images.sql`
7. `007_customer_profiles.sql`

Each file is written to be safe to run more than once where PostgreSQL supports
that cleanly. Do not edit an already-applied migration. Add a new numbered file
for future schema or seed changes.

## Verification

After applying migrations, confirm the expected records exist:

```sql
select slug, checkout_type from categories order by sort_order;
select slug, checkout_type, price_pesewas, price_label from products order by created_at;
```
