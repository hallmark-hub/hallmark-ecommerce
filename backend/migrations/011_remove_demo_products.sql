-- Remove the original development-only catalog. Production products must be
-- created and maintained through the admin inventory dashboard.
--
-- The fixed IDs make this cleanup safe even if an administrator later creates
-- a legitimate product with one of the old sample slugs.

delete from products
where id in (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
);
