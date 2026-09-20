from typing import Literal

from pydantic import BaseModel, Field
from pydantic import model_validator


class ContentCard(BaseModel):
    """Editable public-site card content."""

    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=600)
    image_url: str = Field(default="", max_length=1000)
    image_alt: str = Field(default="", max_length=200)


class ServiceCard(ContentCard):
    """Editable service content with a stable route matching the client groups."""

    slug: Literal[
        "uniforms",
        "branding-embroidery",
        "kitchen-solutions",
        "disposables",
        "robotics",
    ]


class QuoteOption(BaseModel):
    """Editable label for a fixed quote-category option."""

    slug: Literal[
        "uniforms",
        "branding-embroidery",
        "kitchen-equipment",
        "kitchen-setup",
        "disposables",
        "robotics",
        "other",
    ]
    title: str = Field(min_length=1, max_length=120)


class SiteContent(BaseModel):
    """Admin-managed content used across the public storefront."""

    company_name: str = Field(min_length=1, max_length=120)
    company_tagline: str = Field(min_length=1, max_length=300)
    established_year: str = Field(default="", max_length=20)
    contact_email: str = Field(min_length=3, max_length=200, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    contact_phone: str = Field(min_length=6, max_length=40, pattern=r"^\+233(?:\s*\d){9}$")
    contact_secondary_phone: str = Field(min_length=6, max_length=40, pattern=r"^\+233(?:\s*\d){9}$")
    whatsapp_number: str = Field(min_length=10, max_length=15, pattern=r"^\d{10,15}$")
    contact_address: str = Field(min_length=3, max_length=300)
    business_hours: str = Field(min_length=3, max_length=120)
    seo_title: str = Field(min_length=1, max_length=180)
    seo_description: str = Field(min_length=1, max_length=320)

    home_hero_eyebrow: str = Field(min_length=1, max_length=120)
    home_hero_title: str = Field(min_length=1, max_length=180)
    home_hero_body: str = Field(min_length=1, max_length=500)
    home_hero_image_url: str = Field(min_length=1, max_length=1000)
    home_uniform_image_url: str = Field(min_length=1, max_length=1000)
    home_equipment_image_url: str = Field(min_length=1, max_length=1000)
    home_branding_image_url: str = Field(min_length=1, max_length=1000)
    home_robotics_title: str = Field(min_length=1, max_length=180)
    home_robotics_body: str = Field(min_length=1, max_length=500)
    home_robotics_image_url: str = Field(min_length=1, max_length=1000)
    home_company_title: str = Field(min_length=1, max_length=180)
    home_company_body: str = Field(min_length=1, max_length=500)

    about_title: str = Field(min_length=1, max_length=180)
    about_body: str = Field(min_length=1, max_length=800)
    about_image_url: str = Field(min_length=1, max_length=1000)
    about_purpose_title: str = Field(min_length=1, max_length=180)
    about_purpose_body: str = Field(min_length=1, max_length=800)
    about_capabilities: list[ContentCard] = Field(min_length=1, max_length=8)

    robotics_title: str = Field(min_length=1, max_length=180)
    robotics_body: str = Field(min_length=1, max_length=800)
    robotics_hero_image_url: str = Field(min_length=1, max_length=1000)
    robotics_intro_title: str = Field(min_length=1, max_length=180)
    robotics_intro_body: str = Field(min_length=1, max_length=600)
    robotics_cards: list[ContentCard] = Field(min_length=1, max_length=6)
    global_partners: list[ContentCard] = Field(min_length=1, max_length=8)
    services: list[ServiceCard] = Field(min_length=1, max_length=8)
    quote_options: list[QuoteOption] = Field(min_length=7, max_length=7)
    quote_image_url: str = Field(min_length=1, max_length=1000)

    show_about_page: bool = True
    show_robotics_page: bool = True

    @model_validator(mode="after")
    def validate_service_routes(self) -> "SiteContent":
        """Keep all service and quote routes present and unique while copy stays editable."""
        service_slugs = [service.slug for service in self.services]
        if len(service_slugs) != 5 or len(set(service_slugs)) != 5:
            raise ValueError("All five service routes must be present exactly once")

        option_slugs = [option.slug for option in self.quote_options]
        if len(option_slugs) != 7 or len(set(option_slugs)) != 7:
            raise ValueError("All seven quote options must be present exactly once")
        return self
