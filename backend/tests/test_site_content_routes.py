import pytest
from pydantic import ValidationError

from app.main import app
from app.models.site_content import SiteContent
from app.repositories.site_content_repository import InMemorySiteContentRepository
from app.services.site_content_service import LOCAL_DEFAULT_CONTENT, SiteContentService


@pytest.fixture
def service() -> SiteContentService:
    InMemorySiteContentRepository._content = None
    return SiteContentService(InMemorySiteContentRepository())


def test_site_content_routes_are_registered() -> None:
    methods_by_path: dict[str, set[str]] = {}
    for route in app.routes:
        if hasattr(route, "methods"):
            methods_by_path.setdefault(route.path, set()).update(route.methods)

    assert "GET" in methods_by_path["/api/v1/site-content"]
    assert "GET" in methods_by_path["/api/v1/admin/site-content"]
    assert "PUT" in methods_by_path["/api/v1/admin/site-content"]


def test_admin_update_is_returned_by_public_content_service(service: SiteContentService) -> None:
    content = {**LOCAL_DEFAULT_CONTENT, "home_hero_title": "An admin-managed title"}

    saved = service.update(SiteContent.model_validate(content))

    assert saved.home_hero_title == "An admin-managed title"
    assert service.get().home_hero_title == "An admin-managed title"


def test_admin_site_content_rejects_incomplete_payload() -> None:
    with pytest.raises(ValidationError):
        SiteContent.model_validate({"company_name": "Only"})


def test_default_content_includes_editable_media_and_contact(service: SiteContentService) -> None:
    content = service.get()

    assert content.company_name == "ChefWare Enterprise"
    assert content.whatsapp_number == "233548933215"
    assert content.contact_secondary_phone == "+233 55 679 0570"
    assert content.business_hours == "Monday–Friday, 8:00 AM–5:00 PM"
    assert content.home_hero_image_url
    assert len(content.robotics_cards) == 5
    assert len(content.services) == 5
    assert content.services[0].slug == "uniforms"
    assert len(content.quote_options) == 7
    assert content.quote_options[0].slug == "uniforms"
    assert [option.slug for option in content.quote_options] == [
        "uniforms",
        "branding-embroidery",
        "kitchen-equipment",
        "kitchen-setup",
        "disposables",
        "robotics",
        "other",
    ]


def test_saved_content_from_older_schema_receives_new_defaults(
    service: SiteContentService,
) -> None:
    missing_fields = {
        "seo_title",
        "seo_description",
        "home_uniform_image_url",
        "home_equipment_image_url",
        "home_branding_image_url",
        "services",
        "quote_options",
        "quote_image_url",
    }
    InMemorySiteContentRepository._content = {
        key: value
        for key, value in LOCAL_DEFAULT_CONTENT.items()
        if key not in missing_fields
    }
    InMemorySiteContentRepository._content["home_hero_title"] = "Saved admin title"

    content = service.get()

    assert content.home_hero_title == "Saved admin title"
    assert content.seo_title == LOCAL_DEFAULT_CONTENT["seo_title"]
    assert content.home_uniform_image_url == LOCAL_DEFAULT_CONTENT["home_uniform_image_url"]
    assert len(content.services) == 5
    assert len(content.quote_options) == 7
    assert content.quote_image_url == LOCAL_DEFAULT_CONTENT["quote_image_url"]
