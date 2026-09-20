-- Publish the client-documented Global Partnerships on the Robotics page.
--
-- The client website document (section 10 "Our Global Partnerships",
-- Professional Website Structure docx) names KEENON, ALPHA ROBOTICS COMPANY and
-- PIMAK TURKIYE. Owner confirmed in-session on 2026-09-20 that featuring these
-- names is approved (the supplied document is the approval), superseding the
-- earlier "withhold until explicitly cleared" note.

update site_content
set content = content || jsonb_build_object(
    'global_partners', jsonb_build_array(
        jsonb_build_object('title', 'KEENON', 'body', 'Hospitality and service robotics.', 'image_url', '/clients-logo/KENON-removebg-preview.png', 'image_alt', 'KEENON logo'),
        jsonb_build_object('title', 'ALPHA ROBOTICS COMPANY', 'body', 'Robotics solutions.'),
        jsonb_build_object('title', 'PIMAK TURKIYE', 'body', 'International sourcing for kitchen equipment and disposable products.')
    )
)
where id = 'public-site';