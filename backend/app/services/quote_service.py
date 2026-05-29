from datetime import UTC, datetime
from uuid import uuid4

from app.models.catalog import CheckoutType
from app.models.quotes import (
    AdminQuoteSummary,
    CreateQuoteRequest,
    CreateQuoteResponse,
    QuoteStatus,
)
from app.repositories.quote_repository import QuoteRepository, get_quote_repository
from app.services.notification_service import NotificationService, get_notification_service


class QuoteValidationError(ValueError):
    """Raised when a quote request violates business rules."""


class QuoteService:
    """Quote request business logic."""

    def __init__(
        self,
        repository: QuoteRepository,
        notifications: NotificationService,
    ) -> None:
        self.repository = repository
        self.notifications = notifications

    def create_quote_request(self, request: CreateQuoteRequest) -> CreateQuoteResponse:
        """Create a quote request for quote-only categories/products."""
        category = self.repository.get_category_by_slug(request.category_slug)
        if category is None:
            raise QuoteValidationError("Quote category not found")
        if category["checkout_type"] != CheckoutType.quote:
            raise QuoteValidationError("Category does not support quote requests")

        product_ids = [str(product_id) for product_id in request.product_ids]
        products = self.repository.get_products_by_ids(product_ids)
        products_by_id = {str(product["id"]): product for product in products}
        if len(products_by_id) != len(set(product_ids)):
            raise QuoteValidationError("One or more products were not found")

        for product in products:
            if product["checkout_type"] != CheckoutType.quote:
                raise QuoteValidationError("Direct checkout products cannot be quoted")
            if product.get("category_slug") != request.category_slug:
                raise QuoteValidationError("Quote products must match the selected category")

        now = datetime.now(UTC)
        quote_request = {
            "reference": _generate_quote_reference(now),
            "name": request.name,
            "email": request.email,
            "phone": request.phone,
            "category_id": str(category["id"]),
            "category_slug": request.category_slug,
            "message": request.message,
            "status": QuoteStatus.received.value,
            "notification_attempted": self.notifications.should_send_admin_notifications(),
            "notification_sent": False,
        }
        created = self.repository.create_quote_request(quote_request, product_ids)
        notification_sent = self.notifications.notify_quote_request(created["reference"])
        if notification_sent:
            created["notification_sent"] = True
        return CreateQuoteResponse.model_validate(created)

    def list_quote_requests(self, limit: int = 50) -> list[AdminQuoteSummary]:
        """Return recent quote requests for admin views."""
        rows = self.repository.list_quote_requests(limit)
        return [AdminQuoteSummary.model_validate(row) for row in rows]

    def get_quote_request(self, reference: str) -> AdminQuoteSummary | None:
        """Return one quote request for admin views."""
        row = self.repository.get_quote_request(reference)
        return AdminQuoteSummary.model_validate(row) if row is not None else None

    def update_quote_status(
        self,
        reference: str,
        status: QuoteStatus,
    ) -> AdminQuoteSummary | None:
        """Update a quote request status."""
        row = self.repository.update_quote_status(reference, status.value)
        return AdminQuoteSummary.model_validate(row) if row is not None else None


def _generate_quote_reference(now: datetime) -> str:
    suffix = str(uuid4().int % 10000).zfill(4)
    return f"QR-{now:%Y%m%d}-{suffix}"


async def get_quote_service() -> QuoteService:
    """Dependency provider for quote service."""
    return QuoteService(
        repository=get_quote_repository(),
        notifications=await get_notification_service(),
    )
