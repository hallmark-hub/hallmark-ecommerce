-- ChefWare Enterprise contract categories.
-- Apply manually after 001_initial_schema.sql.

insert into categories (
    id,
    name,
    slug,
    description,
    checkout_type,
    image_url,
    sort_order
) values
(
    '00000000-0000-4000-8000-000000000001',
    'Chef Uniforms',
    'chef-uniforms',
    'Premium chef jackets, trousers, aprons, hats, and complete kitchen attire.',
    'direct',
    'https://res.cloudinary.com/chefware/categories/chef-uniforms.jpg',
    1
),
(
    '00000000-0000-4000-8000-000000000002',
    'Restaurant Staff Uniforms & Branding',
    'staff-uniforms-branding',
    'Branded uniforms for front-of-house, service, and hospitality teams.',
    'direct',
    'https://res.cloudinary.com/chefware/categories/staff-uniforms.jpg',
    2
),
(
    '00000000-0000-4000-8000-000000000003',
    'Industrial Kitchen Equipment & Tools',
    'kitchen-equipment-tools',
    'Commercial kitchen equipment, tools, and operational essentials.',
    'direct',
    'https://res.cloudinary.com/chefware/categories/kitchen-equipment.jpg',
    3
),
(
    '00000000-0000-4000-8000-000000000004',
    'Industrial Kitchen Setup',
    'kitchen-setup',
    'Consultation and equipment planning for full commercial kitchens.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/kitchen-setup.jpg',
    4
),
(
    '00000000-0000-4000-8000-000000000005',
    'Customized Machine Pre-Orders',
    'machine-preorders',
    'Pre-order customized commercial kitchen machines.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/machine-preorders.jpg',
    5
),
(
    '00000000-0000-4000-8000-000000000006',
    'Machine Customization',
    'machine-customization',
    'Custom machine modifications for hospitality operations.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/machine-customization.jpg',
    6
),
(
    '00000000-0000-4000-8000-000000000007',
    'Embroidery Services',
    'embroidery',
    'Embroidery services for uniforms and branded garments.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/embroidery.jpg',
    7
),
(
    '00000000-0000-4000-8000-000000000008',
    'Logo Printing & Garment Branding',
    'logo-printing-branding',
    'Logo printing and garment branding for teams and businesses.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/logo-printing.jpg',
    8
)
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    checkout_type = excluded.checkout_type,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    is_active = true;
