-- Sample products matching the current backend in-memory catalog.
-- Apply manually after 002_seed_categories.sql.

insert into products (
    id,
    category_id,
    name,
    slug,
    description,
    checkout_type,
    price_pesewas,
    price_label,
    images,
    in_stock,
    stock_qty,
    tags,
    created_at
) values
(
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Classic White Chef Jacket',
    'classic-white-chef-jacket',
    'Premium cotton chef jacket for professional kitchen teams.',
    'direct',
    15000,
    null,
    array['https://res.cloudinary.com/chefware/products/chef-jacket.jpg'],
    true,
    50,
    array['jacket', 'uniform'],
    '2026-05-25T00:00:00Z'
),
(
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Chef Apron with Pocket',
    'chef-apron-with-pocket',
    'Durable apron with front pocket for daily kitchen use.',
    'direct',
    8500,
    null,
    array['https://res.cloudinary.com/chefware/products/chef-apron.jpg'],
    true,
    80,
    array['apron', 'uniform'],
    '2026-05-25T00:00:00Z'
),
(
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004',
    'Full Kitchen Setup Consultation',
    'full-kitchen-setup-consultation',
    'Planning support for restaurants building commercial kitchen capacity.',
    'quote',
    null,
    'Request a quote',
    array['https://res.cloudinary.com/chefware/products/kitchen-setup.jpg'],
    true,
    1,
    array['consultation', 'setup'],
    '2026-05-25T00:00:00Z'
)
on conflict (slug) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    checkout_type = excluded.checkout_type,
    price_pesewas = excluded.price_pesewas,
    price_label = excluded.price_label,
    images = excluded.images,
    in_stock = excluded.in_stock,
    stock_qty = excluded.stock_qty,
    tags = excluded.tags,
    is_active = true;
