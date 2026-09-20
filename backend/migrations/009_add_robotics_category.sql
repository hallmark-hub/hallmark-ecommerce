-- Add the quote-only hospitality robotics category.
-- Apply manually after 008_order_stock_application.sql.

insert into categories (
    id,
    name,
    slug,
    description,
    checkout_type,
    image_url,
    sort_order
)
values (
    '00000000-0000-4000-8000-000000000009',
    'Hospitality Robotics',
    'robotics',
    'Consultative enquiries for hospitality service, delivery, and cleaning robots.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/robotics.jpg',
    9
)
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    checkout_type = excluded.checkout_type,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order;
