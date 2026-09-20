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
8. `008_order_stock_application.sql`
9. `009_add_robotics_category.sql`
10. `010_site_content.sql`
11. `011_remove_demo_products.sql`
12. `012_refresh_client_website_content.sql`
13. `013_quote_request_business_details.sql`

Each file is written to be safe to run more than once where PostgreSQL supports
that cleanly. Do not edit an already-applied migration. Add a new numbered file
for future schema or seed changes.

## Verification

After applying migrations, confirm the expected records exist:

```sql
select slug, checkout_type from categories order by sort_order;
select slug, checkout_type, price_pesewas, price_label from products order by created_at;
```

After `008`, confirm stock application is in place — the API decrements
stock through this function once a payment is confirmed:

```sql
select column_name from information_schema.columns
 where table_name = 'orders' and column_name = 'stock_applied';
select proname from pg_proc where proname = 'apply_order_stock';
```

After `009`, confirm the quote-only robotics category exists:

```sql
select slug, checkout_type from categories where slug = 'robotics';
```

After `010`, confirm the editable public website record exists:

```sql
select id, updated_at from site_content where id = 'public-site';
```

After `011`, confirm the development-only sample products are absent. Products
for sale must be created and maintained through the admin inventory dashboard:

```sql
select id, slug from products
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);
```

After `013`, confirm business quote details can be stored:

```sql
select company_name, location, quantity, preferred_delivery_date
from quote_requests
limit 1;
```
