-- Fix product images: replace broken/mismatched Cloudinary URLs with
-- matching high-resolution Unsplash images. Run in Supabase SQL Editor after
-- 005_remove_manual_bank_transfer.sql.

-- ── Chef Uniforms ────────────────────────────────────────────────────────────

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=900&q=80'
] WHERE slug = 'classic-white-chef-jacket';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=80'
] WHERE slug = 'forest-green-executive-chef-jacket';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1595475038784-bbe439ff41e6?w=900&q=80'
] WHERE slug = 'chef-trouser-set-3-pack';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1537624204044-4928ddab6b57?w=900&q=80'
] WHERE slug = 'chef-apron-with-pocket';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1611174797136-5c94f88e0f3e?w=900&q=80'
] WHERE slug = 'professional-bib-apron';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1521986329282-0436c1f1e212?w=900&q=80'
] WHERE slug IN ('chef-cap', 'chef-hat', 'chef-skull-cap');

-- ── Staff Uniforms ───────────────────────────────────────────────────────────

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80'
] WHERE slug LIKE '%waiter%' OR slug LIKE '%server%' OR slug LIKE '%front-of-house%';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=900&q=80'
] WHERE slug LIKE '%polo%' OR slug LIKE '%staff-shirt%';

-- ── Kitchen Equipment ────────────────────────────────────────────────────────

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80'
] WHERE slug LIKE '%commercial-oven%' OR slug LIKE '%range%' OR slug LIKE '%wok%';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=900&q=80'
] WHERE slug LIKE '%refrigerator%' OR slug LIKE '%fridge%' OR slug LIKE '%freezer%';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=900&q=80'
] WHERE slug LIKE '%knife%' OR slug LIKE '%knives%' OR slug LIKE '%blade%';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80'
] WHERE slug LIKE '%food-processor%' OR slug LIKE '%blender%' OR slug LIKE '%mixer%';

-- ── Kitchen Setup & Services ─────────────────────────────────────────────────

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80'
] WHERE slug IN ('full-kitchen-setup-consultation', 'kitchen-setup-consultation');

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=900&q=80'
] WHERE slug LIKE '%embroidery%' OR slug LIKE '%logo-print%' OR slug LIKE '%branding%';
