-- Store public website copy, media references, contact details and visibility.
-- Apply manually after 009_add_robotics_category.sql.

create table if not exists site_content (
    id text primary key,
    content jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists site_content_set_updated_at on site_content;
create trigger site_content_set_updated_at
before update on site_content
for each row execute function set_updated_at();

alter table site_content enable row level security;

insert into site_content (id, content)
values (
    'public-site',
    jsonb_build_object(
        'company_name', 'ChefWare Enterprise',
        'company_tagline', 'Hospitality products, projects and operational technology.',
        'established_year', '2023',
        'contact_email', 'admin@chefwareenterprise.org',
        'contact_phone', '+233 54 893 3215',
        'whatsapp_number', '233548933215',
        'contact_address', 'Dome, near the market — Accra, Ghana',
        'seo_title', 'ChefWare Enterprise — Hospitality Supplies for Businesses in Ghana',
        'seo_description', 'Shop stocked uniforms and equipment, or request a tailored quote for kitchen projects, embroidery, branding and robotics.',
        'home_hero_eyebrow', 'Hospitality supplies for businesses in Ghana',
        'home_hero_title', 'Equip Your Hospitality Business with Confidence',
        'home_hero_body', 'Source uniforms and stocked equipment, or get a tailored quote for kitchen setup, embroidery, and branding.',
        'home_hero_image_url', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
        'home_uniform_image_url', '/media/chefware/chef-uniform-combo.jpg',
        'home_equipment_image_url', '/media/chefware/cold-bain-marie.jpg',
        'home_branding_image_url', '/media/chefware/chef-jacket-gold-stripe.jpeg',
        'home_robotics_title', 'Explore smarter ways to support service, delivery and cleaning operations.',
        'home_robotics_body', 'Robotics is handled as a consultative business enquiry, with the venue and workflow considered before a solution is proposed.',
        'home_robotics_image_url', '/media/chefware/service-robot.jpg',
        'home_company_title', 'Buy what is ready. Plan what is custom.',
        'home_company_body', 'ChefWare brings hospitality products, project enquiries and emerging technology into one practical buying journey.',
        'about_title', 'One partner for the products and projects behind hospitality operations.',
        'about_body', 'ChefWare Enterprise brings uniforms, commercial kitchen equipment, branding services and emerging hospitality technology into one practical buying journey.',
        'about_image_url', '/media/chefware/chef-uniform-combo.jpg',
        'about_purpose_title', 'Make hospitality sourcing easier to navigate.',
        'about_purpose_body', 'Businesses should not have to guess whether to buy, request a customised specification, or plan a larger project. ChefWare separates those routes while keeping them under one roof.',
        'about_capabilities', jsonb_build_array(
            jsonb_build_object('title', 'Professional teamwear', 'body', 'Chef and hospitality uniforms, with branding options for a consistent team presentation.'),
            jsonb_build_object('title', 'Commercial equipment', 'body', 'Stocked equipment alongside a quote-led sourcing path for larger or specialised requirements.'),
            jsonb_build_object('title', 'Business projects', 'body', 'A structured enquiry route for kitchen setup, equipment planning and multi-item requirements.'),
            jsonb_build_object('title', 'Smarter hospitality', 'body', 'Robotics enquiries for service, room delivery and cleaning use cases.')
        ),
        'robotics_title', 'Explore robotics for modern hospitality operations.',
        'robotics_body', 'Start with the operational need. ChefWare can help you explore service, room-delivery and cleaning robot options through a tailored business enquiry.',
        'robotics_hero_image_url', '/media/chefware/service-robot.jpg',
        'robotics_intro_title', 'Technology matched to the work',
        'robotics_intro_body', 'Robotics is a consultative purchase. Product fit depends on the venue, workflow and operating conditions.',
        'robotics_cards', jsonb_build_array(
            jsonb_build_object('title', 'Service & engagement robots', 'body', 'Explore robotic assistance for food service, guest engagement and promotional experiences.', 'image_url', '/media/chefware/service-robot.jpg', 'image_alt', 'Hospitality service robot in a restaurant setting'),
            jsonb_build_object('title', 'Room-service delivery robots', 'body', 'Discuss controlled delivery workflows for hotels and other suitable indoor environments.', 'image_url', '/media/chefware/room-service-robot.jpg', 'image_alt', 'Room-service delivery robot'),
            jsonb_build_object('title', 'Professional cleaning robots', 'body', 'Assess repetitive floor-cleaning use cases for hospitality and commercial facilities.', 'image_url', '/media/chefware/cleaning-robot.jpg', 'image_alt', 'Professional cleaning robot in a hotel corridor')
        ),
        'services', jsonb_build_array(
            jsonb_build_object('slug', 'kitchen-setup', 'title', 'Industrial Kitchen Setup', 'body', 'Plan a commercial kitchen requirement covering equipment selection, supply, installation, and commissioning needs.', 'image_url', '/media/chefware/products/refrigerated-cold-bain-marie.jpg', 'image_alt', 'Commercial kitchen equipment'),
            jsonb_build_object('slug', 'machine-preorders', 'title', 'Customized Machine Pre-Orders', 'body', 'Request specialised commercial equipment against the capacity, features, or operating needs of your business.', 'image_url', '/media/chefware/products/commercial-combi-oven.jpg', 'image_alt', 'Commercial combi oven'),
            jsonb_build_object('slug', 'machine-customization', 'title', 'Machine Customization', 'body', 'Discuss possible equipment modifications for a specific operating requirement, subject to assessment.', 'image_url', '/media/chefware/products/commercial-egg-boiler.jpg', 'image_alt', 'Commercial kitchen machine'),
            jsonb_build_object('slug', 'embroidery', 'title', 'Embroidery Services', 'body', 'Request logo embroidery for chef jackets, aprons, caps, uniforms, and other suitable garments.', 'image_url', '/media/chefware/products/chef-uniform-combo.jpg', 'image_alt', 'Chef uniform set'),
            jsonb_build_object('slug', 'logo-printing-branding', 'title', 'Logo Printing & Garment Branding', 'body', 'Explore printing and garment branding options for uniforms, teamwear, and promotional apparel.', 'image_url', '/media/chefware/products/white-gold-stripe-chef-top.jpeg', 'image_alt', 'Branded chef uniform'),
            jsonb_build_object('slug', 'robotics', 'title', 'Hospitality Robotics', 'body', 'Explore service, delivery, and cleaning robots through a consultative business enquiry.', 'image_url', '/media/chefware/products/dinnerbot-delivery-marketing-robot.jpg', 'image_alt', 'Hospitality service robot')
        ),
        'quote_image_url', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1600&q=90',
        'show_about_page', true,
        'show_robotics_page', true
    )
)
on conflict (id) do nothing;
