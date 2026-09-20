-- Align quote categories, services and quote options with the client
-- Professional Website Structure document (the only source of truth).
--
-- The client document defines seven quote/contact options:
-- Uniforms; Branding & Embroidery; Kitchen Equipment; Kitchen Setup;
-- Disposables; Robotics; Other.
--
-- Legacy quote categories (machine-preorders, machine-customization,
-- embroidery, logo-printing-branding) are folded into the document groups and
-- deactivated. Products keep their category_id references, so nothing is
-- deleted; existing products remain visible through the shop.

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
    '00000000-0000-4000-8000-000000000010',
    'Uniforms',
    'uniforms',
    'Quote enquiries for professional and customised hospitality uniforms.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/chef-uniforms.jpg',
    4
),
(
    '00000000-0000-4000-8000-000000000011',
    'Branding & Embroidery',
    'branding-embroidery',
    'T-shirt printing, embroidery and customised branding enquiries.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/embroidery.jpg',
    5
),
(
    '00000000-0000-4000-8000-000000000012',
    'Kitchen Equipment',
    'kitchen-equipment',
    'Sourcing and importation enquiries for commercial kitchen equipment.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/kitchen-equipment.jpg',
    6
),
(
    '00000000-0000-4000-8000-000000000013',
    'Disposables',
    'disposables',
    'Tissues, bowls, spoons, takeaway packs and other hospitality disposables.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/disposables.jpg',
    8
),
(
    '00000000-0000-4000-8000-000000000014',
    'Other',
    'other',
    'Other hospitality sourcing requirements not covered by the listed categories.',
    'quote',
    'https://res.cloudinary.com/chefware/categories/other.jpg',
    10
)
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    checkout_type = excluded.checkout_type,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    is_active = true;

-- Keep the document-group naming for the retained categories.
update categories
set name = 'Kitchen Setup'
where slug = 'kitchen-setup';

update categories
set name = 'Hospitality Robotics'
where slug = 'robotics';

-- Deactivate the folded legacy quote categories; rows are retained so existing
-- product references stay valid.
update categories
set is_active = false
where slug in (
    'machine-preorders',
    'machine-customization',
    'embroidery',
    'logo-printing-branding'
);

-- Refresh the public-site content record with the document service groups and
-- the exact seven quote options used by the quote/contact form.
update site_content
set content = content || jsonb_build_object(
    'quote_options', jsonb_build_array(
        jsonb_build_object('slug', 'uniforms', 'title', 'Uniforms'),
        jsonb_build_object('slug', 'branding-embroidery', 'title', 'Branding & Embroidery'),
        jsonb_build_object('slug', 'kitchen-equipment', 'title', 'Kitchen Equipment'),
        jsonb_build_object('slug', 'kitchen-setup', 'title', 'Kitchen Setup'),
        jsonb_build_object('slug', 'disposables', 'title', 'Disposables'),
        jsonb_build_object('slug', 'robotics', 'title', 'Robotics'),
        jsonb_build_object('slug', 'other', 'title', 'Other')
    ),
    'services', jsonb_build_array(
        jsonb_build_object('slug', 'uniforms', 'title', 'Professional Hospitality Uniforms', 'body', 'Chef uniforms, hospitality staff uniforms, security and management wear, and customised staff uniforms.', 'image_url', '/media/chefware/products/chef-uniform-combo.jpg', 'image_alt', 'Chef uniform set'),
        jsonb_build_object('slug', 'branding-embroidery', 'title', 'Branding & Embroidery', 'body', 'T-shirt printing, embroidery and customised branding for businesses, schools and institutions.', 'image_url', '/media/chefware/products/white-gold-stripe-chef-top.jpeg', 'image_alt', 'Branded chef uniform'),
        jsonb_build_object('slug', 'kitchen-solutions', 'title', 'Commercial Kitchen Solutions', 'body', 'Kitchen equipment sourcing, importation, full kitchen setup, installation and after-sales support.', 'image_url', '/media/chefware/products/refrigerated-cold-bain-marie.jpg', 'image_alt', 'Commercial kitchen equipment'),
        jsonb_build_object('slug', 'disposables', 'title', 'Hospitality Disposables', 'body', 'Tissues, bowls, spoons, takeaway packs and other disposable hospitality essentials.', 'image_url', '/media/chefware/products/commercial-egg-boiler.jpg', 'image_alt', 'Hospitality disposables'),
        jsonb_build_object('slug', 'robotics', 'title', 'Hospitality Robotics', 'body', 'Explore cleaning, service, marketing, luggage-loading and room-service robots through a consultative business enquiry.', 'image_url', '/media/chefware/products/dinnerbot-delivery-marketing-robot.jpg', 'image_alt', 'Hospitality service robot')
    )
)
where id = 'public-site';