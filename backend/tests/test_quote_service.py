from uuid import UUID

import pytest

from app.models.quotes import CreateQuoteRequest
from app.repositories.quote_repository import InMemoryQuoteRepository
from app.services.notification_service import NotificationService
from app.services.quote_service import QuoteService, QuoteValidationError


QUOTE_PRODUCT_ID = UUID("10000000-0000-4000-8000-000000000003")
DIRECT_PRODUCT_ID = UUID("10000000-0000-4000-8000-000000000001")


def quote_payload(
    category_slug: str = "kitchen-setup",
    product_id: UUID = QUOTE_PRODUCT_ID,
) -> dict[str, object]:
    return {
        "name": "Kwame Asante",
        "email": "kwame@example.com",
        "phone": "+233244123456",
        "category_slug": category_slug,
        "message": "We need a full kitchen setup for a 60-seat restaurant.",
        "company_name": "Asante Catering",
        "location": "East Legon, Accra",
        "quantity": "60 settings",
        "preferred_delivery_date": "2026-10-15",
        "product_ids": [str(product_id)],
    }


def test_create_quote_request_returns_reference_and_received_status() -> None:
    service = QuoteService(
        repository=InMemoryQuoteRepository(),
        notifications=NotificationService(),
    )
    request = CreateQuoteRequest.model_validate(quote_payload())

    quote = service.create_quote_request(request)

    assert quote.reference.startswith("QR-")
    assert quote.status == "received"


def test_create_quote_request_keeps_business_scoping_details() -> None:
    repository = InMemoryQuoteRepository()
    service = QuoteService(repository=repository, notifications=NotificationService())

    service.create_quote_request(CreateQuoteRequest.model_validate(quote_payload()))

    stored = next(iter(repository.quote_requests.values()))
    assert stored["company_name"] == "Asante Catering"
    assert stored["location"] == "East Legon, Accra"
    assert stored["quantity"] == "60 settings"
    assert stored["preferred_delivery_date"] == "2026-10-15"


def test_create_robotics_quote_request_without_product() -> None:
    service = QuoteService(
        repository=InMemoryQuoteRepository(),
        notifications=NotificationService(),
    )
    payload = quote_payload(category_slug="robotics")
    payload["product_ids"] = []
    payload["message"] = "We want to assess a service robot for our restaurant."

    quote = service.create_quote_request(CreateQuoteRequest.model_validate(payload))

    assert quote.status == "received"


def test_create_quote_request_rejects_direct_category() -> None:
    service = QuoteService(
        repository=InMemoryQuoteRepository(),
        notifications=NotificationService(),
    )
    request = CreateQuoteRequest.model_validate(
        quote_payload(category_slug="chef-uniforms", product_id=DIRECT_PRODUCT_ID)
    )

    with pytest.raises(QuoteValidationError, match="Category does not support"):
        service.create_quote_request(request)


def test_create_quote_request_rejects_direct_product() -> None:
    service = QuoteService(
        repository=InMemoryQuoteRepository(),
        notifications=NotificationService(),
    )
    request = CreateQuoteRequest.model_validate(
        quote_payload(category_slug="kitchen-setup", product_id=DIRECT_PRODUCT_ID)
    )

    with pytest.raises(QuoteValidationError, match="Direct checkout products"):
        service.create_quote_request(request)
