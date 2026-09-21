from app.models.site_content import SiteContent
from app.repositories.site_content_repository import (
    SiteContentRepository,
    get_site_content_repository,
)


LOCAL_DEFAULT_CONTENT = {
    "company_name": "ChefWare Enterprise",
    "company_tagline": "Importers and suppliers of hospitality service essentials.",
    "established_year": "2023",
    "contact_email": "admin@chefwareenterprise.org",
    "contact_phone": "+233 54 893 3215",
    "contact_secondary_phone": "+233 55 679 0570",
    "whatsapp_number": "233548933215",
    "contact_address": "Dome, near the market — Accra, Ghana",
    "business_hours": "Monday–Friday, 8:00 AM–5:00 PM",
    "seo_title": "ChefWare Enterprise — Complete Hospitality Solutions in Ghana",
    "seo_description": "Shop stocked hospitality products or request a quote for uniforms, branding, commercial kitchen solutions, disposables and robotics.",
    "home_hero_eyebrow": "One supplier. Everything you need. Smarter operations.",
    "home_hero_title": "Complete Hospitality Solutions. All Under One Roof.",
    "home_hero_body": "From professional uniforms and branding to commercial kitchen solutions, disposables and hospitality robotics, ChefWare Enterprise helps businesses build smarter, more efficient operations.",
    "home_hero_image_url": "/media/chefware/chef-uniform-combo.jpg",
    "home_uniform_image_url": "/media/chefware/chef-uniform-combo.jpg",
    "home_equipment_image_url": "/media/chefware/cold-bain-marie.jpg",
    "home_branding_image_url": "/media/chefware/chef-jacket-gold-stripe.jpeg",
    "home_robotics_title": "The future of hospitality is here.",
    "home_robotics_body": "Smart robotic solutions designed to support hospitality businesses, improve service efficiency and reduce operational workload.",
    "home_robotics_image_url": "/media/chefware/robotics-hero.mp4",
    "home_company_title": "One partner. Everything you need.",
    "home_company_body": "ChefWare helps hotels, restaurants, cafés, catering businesses, institutions and corporate organisations reduce sourcing challenges, save time and operate more efficiently.",
    "about_title": "Hospitality essentials, sourced under one roof.",
    "about_body": "Founded on 2 October 2023 by Madam Rebecca Eghan and Mr Abraham Eghan, ChefWare Enterprise was established to bridge the sourcing gap in Ghana's hospitality industry.",
    "about_image_url": "/media/chefware/chef-uniform-combo.jpg",
    "about_purpose_title": "Reliable, quality and innovative hospitality solutions.",
    "about_purpose_body": "Our mission is to help businesses save time, reduce operational challenges and work smarter through a practical range of hospitality products and solutions.",
    "about_capabilities": [
        {"title": "Hospitality uniforms", "body": "Professional chef, hospitality, security and management uniforms, including customised staff uniforms."},
        {"title": "Branding & embroidery", "body": "T-shirt printing, embroidery and customised branding for businesses, schools and institutions."},
        {"title": "Commercial kitchen solutions", "body": "Stocked equipment plus a quote-led route for sourcing, importation, installation and full kitchen setup."},
        {"title": "Hospitality disposables", "body": "Tissues, bowls, spoons, takeaway packs and other disposable hospitality essentials available on request."},
    ],
    "robotics_title": "The Future of Hospitality Is Here.",
    "robotics_body": "Explore smart robotic solutions designed to support hospitality businesses, improve service efficiency and reduce operational workload.",
    "robotics_hero_image_url": "/media/chefware/robotics-hero.mp4",
    "robotics_intro_title": "Technology matched to the work",
    "robotics_intro_body": "Start with the venue, workflow and intended task. ChefWare can help scope an appropriate robotics solution through a tailored business enquiry.",
    "robotics_cards": [
        {"title": "Cleaning robots", "body": "Explore robotic support for repetitive cleaning tasks in hospitality and commercial facilities.", "image_url": "/media/chefware/cleaning-robot.jpg", "image_alt": "Professional cleaning robot"},
        {"title": "Service robots", "body": "Assess robotic support for food service and hospitality operations.", "image_url": "/media/chefware/service-robot.jpg", "image_alt": "Hospitality service robot"},
        {"title": "Marketing robots", "body": "Create interactive customer experiences and promotional opportunities.", "image_url": "/media/chefware/service-robot.jpg", "image_alt": "Hospitality marketing robot"},
        {"title": "Luggage-loading robots", "body": "Discuss robot options for luggage-handling operations in suitable venues.", "image_url": "/media/chefware/room-service-robot.jpg", "image_alt": "Hospitality delivery robot"},
        {"title": "Room-service robots", "body": "Explore controlled delivery workflows for hotels and other suitable indoor environments.", "image_url": "/media/chefware/room-service-robot.jpg", "image_alt": "Room-service delivery robot"},
    ],
    "global_partners": [
        {"title": "KEENON", "body": "Hospitality and service robotics.", "image_url": "/clients-logo/KENON-removebg-preview.png", "image_alt": "KEENON logo"},
        {"title": "ALPHA ROBOTICS COMPANY", "body": "Robotics solutions."},
        {"title": "PIMAK TURKIYE", "body": "International sourcing for kitchen equipment and disposable products."},
    ],
    "services": [
        {"slug": "uniforms", "title": "Professional Hospitality Uniforms", "body": "Chef uniforms, hospitality staff uniforms, security and management wear, and customised staff uniforms.", "image_url": "/media/chefware/products/chef-uniform-combo.jpg", "image_alt": "Chef uniform set"},
        {"slug": "branding-embroidery", "title": "Branding & Embroidery", "body": "T-shirt printing, embroidery and customised branding for businesses, schools and institutions.", "image_url": "/media/chefware/products/white-gold-stripe-chef-top.jpeg", "image_alt": "Branded chef uniform"},
        {"slug": "kitchen-solutions", "title": "Commercial Kitchen Solutions", "body": "Kitchen equipment sourcing, importation, full kitchen setup, installation and after-sales support.", "image_url": "/media/chefware/products/refrigerated-cold-bain-marie.jpg", "image_alt": "Commercial kitchen equipment"},
        {"slug": "disposables", "title": "Hospitality Disposables", "body": "Tissues, bowls, spoons, takeaway packs and other disposable hospitality essentials.", "image_url": "/media/chefware/products/commercial-egg-boiler.jpg", "image_alt": "Hospitality disposables"},
        {"slug": "robotics", "title": "Hospitality Robotics", "body": "Explore cleaning, service, marketing, luggage-loading and room-service robots through a consultative business enquiry.", "image_url": "/media/chefware/products/dinnerbot-delivery-marketing-robot.jpg", "image_alt": "Hospitality service robot"},
    ],
    "quote_options": [
        {"slug": "uniforms", "title": "Uniforms"},
        {"slug": "branding-embroidery", "title": "Branding & Embroidery"},
        {"slug": "kitchen-equipment", "title": "Kitchen Equipment"},
        {"slug": "kitchen-setup", "title": "Kitchen Setup"},
        {"slug": "disposables", "title": "Disposables"},
        {"slug": "robotics", "title": "Robotics"},
        {"slug": "other", "title": "Other"},
    ],
    "quote_image_url": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1600&q=90",
    "show_about_page": True,
    "show_robotics_page": True,
}


class SiteContentService:
    """Read and update validated public website content."""

    def __init__(self, repository: SiteContentRepository) -> None:
        self.repository = repository

    def get(self) -> SiteContent:
        """Return saved content with defaults for fields added by newer releases."""
        content = {**LOCAL_DEFAULT_CONTENT, **(self.repository.get() or {})}
        return SiteContent.model_validate(content)

    def update(self, content: SiteContent) -> SiteContent:
        """Persist a complete validated content record."""
        saved = self.repository.update(content.model_dump(mode="json"))
        return SiteContent.model_validate(saved)


async def get_site_content_service() -> SiteContentService:
    """Dependency provider for site content service."""
    return SiteContentService(get_site_content_repository())
