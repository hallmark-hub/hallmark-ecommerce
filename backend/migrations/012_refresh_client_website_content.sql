-- Apply the client-approved September 2026 website positioning to the
-- admin-managed public-site record. Excludes claims pending written approval.

update site_content
set content = content || jsonb_build_object(
    'company_tagline', 'Importers and suppliers of hospitality service essentials.',
    'contact_secondary_phone', '+233 55 679 0570',
    'business_hours', 'Monday–Friday, 8:00 AM–5:00 PM',
    'seo_title', 'ChefWare Enterprise — Complete Hospitality Solutions in Ghana',
    'seo_description', 'Shop stocked hospitality products or request a quote for uniforms, branding, commercial kitchen solutions, disposables and robotics.',
    'home_hero_eyebrow', 'One supplier. Everything you need. Smarter operations.',
    'home_hero_title', 'Complete Hospitality Solutions. All Under One Roof.',
    'home_hero_body', 'From professional uniforms and branding to commercial kitchen solutions, disposables and hospitality robotics, ChefWare Enterprise helps businesses build smarter, more efficient operations.',
    'home_hero_image_url', '/media/chefware/chef-uniform-combo.jpg',
    'home_robotics_title', 'The future of hospitality is here.',
    'home_robotics_body', 'Smart robotic solutions designed to support hospitality businesses, improve service efficiency and reduce operational workload.',
    'home_company_title', 'One partner. Everything you need.',
    'home_company_body', 'ChefWare helps hotels, restaurants, cafés, catering businesses, institutions and corporate organisations reduce sourcing challenges, save time and operate more efficiently.',
    'about_title', 'Hospitality essentials, sourced under one roof.',
    'about_body', 'Founded on 2 October 2023 by Madam Rebecca Eghan and Mr Abraham Eghan, ChefWare Enterprise was established to bridge the sourcing gap in Ghana''s hospitality industry.',
    'about_purpose_title', 'Reliable, quality and innovative hospitality solutions.',
    'about_purpose_body', 'Our mission is to help businesses save time, reduce operational challenges and work smarter through a practical range of hospitality products and solutions.',
    'about_capabilities', jsonb_build_array(
        jsonb_build_object('title', 'Hospitality uniforms', 'body', 'Professional chef, hospitality, security and management uniforms, including customised staff uniforms.'),
        jsonb_build_object('title', 'Branding & embroidery', 'body', 'T-shirt printing, embroidery and customised branding for businesses, schools and institutions.'),
        jsonb_build_object('title', 'Commercial kitchen solutions', 'body', 'Stocked equipment plus a quote-led route for sourcing, importation, installation and full kitchen setup.'),
        jsonb_build_object('title', 'Hospitality disposables', 'body', 'Tissues, bowls, spoons, takeaway packs and other disposable hospitality essentials available on request.')
    ),
    'robotics_title', 'The Future of Hospitality Is Here.',
    'robotics_body', 'Explore smart robotic solutions designed to support hospitality businesses, improve service efficiency and reduce operational workload.',
    'robotics_intro_body', 'Start with the venue, workflow and intended task. ChefWare can help scope an appropriate robotics solution through a tailored business enquiry.',
    'robotics_cards', jsonb_build_array(
        jsonb_build_object('title', 'Cleaning robots', 'body', 'Explore robotic support for repetitive cleaning tasks in hospitality and commercial facilities.', 'image_url', '/media/chefware/cleaning-robot.jpg', 'image_alt', 'Professional cleaning robot'),
        jsonb_build_object('title', 'Service robots', 'body', 'Assess robotic support for food service and hospitality operations.', 'image_url', '/media/chefware/service-robot.jpg', 'image_alt', 'Hospitality service robot'),
        jsonb_build_object('title', 'Marketing robots', 'body', 'Create interactive customer experiences and promotional opportunities.', 'image_url', '/media/chefware/service-robot.jpg', 'image_alt', 'Hospitality marketing robot'),
        jsonb_build_object('title', 'Luggage-loading robots', 'body', 'Discuss robot options for luggage-handling operations in suitable venues.', 'image_url', '/media/chefware/room-service-robot.jpg', 'image_alt', 'Hospitality delivery robot'),
        jsonb_build_object('title', 'Room-service robots', 'body', 'Explore controlled delivery workflows for hotels and other suitable indoor environments.', 'image_url', '/media/chefware/room-service-robot.jpg', 'image_alt', 'Room-service delivery robot')
    ),
    'services', jsonb_build_array(
        jsonb_build_object('slug', 'kitchen-setup', 'title', 'Commercial Kitchen Solutions', 'body', 'Plan equipment sourcing, importation, installation and complete kitchen setup around your operating requirements.', 'image_url', '/media/chefware/products/refrigerated-cold-bain-marie.jpg', 'image_alt', 'Commercial kitchen equipment'),
        jsonb_build_object('slug', 'machine-preorders', 'title', 'Equipment Sourcing & Importation', 'body', 'Request specialised commercial kitchen equipment against the capacity, features and operating needs of your business.', 'image_url', '/media/chefware/products/commercial-combi-oven.jpg', 'image_alt', 'Commercial combi oven'),
        jsonb_build_object('slug', 'machine-customization', 'title', 'Equipment Customisation', 'body', 'Discuss possible equipment modifications for a specific operating requirement, subject to assessment.', 'image_url', '/media/chefware/products/commercial-egg-boiler.jpg', 'image_alt', 'Commercial kitchen machine'),
        jsonb_build_object('slug', 'embroidery', 'title', 'Embroidery Services', 'body', 'Request logo embroidery for chef jackets, aprons, caps, uniforms, and other suitable garments.', 'image_url', '/media/chefware/products/chef-uniform-combo.jpg', 'image_alt', 'Chef uniform set'),
        jsonb_build_object('slug', 'logo-printing-branding', 'title', 'Logo Printing & Garment Branding', 'body', 'Explore printing and garment branding options for uniforms, teamwear, and promotional apparel.', 'image_url', '/media/chefware/products/white-gold-stripe-chef-top.jpeg', 'image_alt', 'Branded chef uniform'),
        jsonb_build_object('slug', 'robotics', 'title', 'Hospitality Robotics', 'body', 'Explore cleaning, service, marketing, luggage-loading and room-service robots through a consultative business enquiry.', 'image_url', '/media/chefware/products/dinnerbot-delivery-marketing-robot.jpg', 'image_alt', 'Hospitality service robot')
    )
)
where id = 'public-site';
