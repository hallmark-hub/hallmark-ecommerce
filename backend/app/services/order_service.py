from datetime import UTC, datetime
from uuid import uuid4

from app.models.catalog import CheckoutType
from app.models.orders import (
    RETURNS_POLICY,
    CreateOrderRequest,
    CreateOrderResponse,
    LookupCustomer,
    LookupOrderItem,
    LookupOrderResponse,
    OrderStatus,
    PaymentStatus,
)
from app.repositories.order_repository import OrderRepository, get_order_repository


class OrderValidationError(ValueError):
    """Raised when an order request violates business rules."""


class OrderService:
    """Order business logic."""

    def __init__(self, repository: OrderRepository) -> None:
        self.repository = repository

    def create_order(self, request: CreateOrderRequest) -> CreateOrderResponse:
        """Create an order for direct checkout products."""
        requested_ids = [str(item.product_id) for item in request.items]
        products = self.repository.get_products_by_ids(requested_ids)
        products_by_id = {str(product["id"]): product for product in products}

        if len(products_by_id) != len(set(requested_ids)):
            raise OrderValidationError("One or more products were not found")

        order_items: list[dict[str, object]] = []
        subtotal = 0
        for item in request.items:
            product = products_by_id[str(item.product_id)]
            if product["checkout_type"] != CheckoutType.direct:
                raise OrderValidationError("Quote-only products cannot be ordered directly")
            price = product.get("price_pesewas")
            if not isinstance(price, int):
                raise OrderValidationError("Product price is not available")
            line_total = price * item.quantity
            subtotal += line_total
            order_items.append(
                {
                    "product_id": str(item.product_id),
                    "product_name": str(product["name"]),
                    "quantity": item.quantity,
                    "unit_price_pesewas": price,
                    "line_total_pesewas": line_total,
                }
            )

        now = datetime.now(UTC)
        order = {
            "reference": _generate_order_reference(now),
            "customer_name": request.customer.name,
            "customer_email": request.customer.email,
            "customer_phone": request.customer.phone,
            "subtotal_pesewas": subtotal,
            "total_pesewas": subtotal,
            "payment_method": request.payment_method.value,
            "payment_status": PaymentStatus.pending.value,
            "order_status": OrderStatus.pending.value,
            "returns_policy": RETURNS_POLICY,
            "accepted_returns_policy": request.accepted_returns_policy,
        }
        created = self.repository.create_order(order, order_items)
        return CreateOrderResponse.model_validate(created)

    def lookup_order(self, reference: str, phone: str) -> LookupOrderResponse | None:
        """Look up an order by reference and customer phone."""
        order = self.repository.lookup_order(reference, phone)
        if order is None:
            return None
        return LookupOrderResponse(
            id=order["id"],
            reference=order["reference"],
            customer=LookupCustomer(
                name=order["customer_name"],
                phone=order["customer_phone"],
            ),
            items=[LookupOrderItem.model_validate(item) for item in order["items"]],
            total_pesewas=order["total_pesewas"],
            payment_method=order["payment_method"],
            payment_status=order["payment_status"],
            order_status=order["order_status"],
            returns_policy=order["returns_policy"],
            created_at=order["created_at"],
        )


def _generate_order_reference(now: datetime) -> str:
    suffix = str(uuid4().int % 10000).zfill(4)
    return f"CW-{now:%Y%m%d}-{suffix}"


async def get_order_service() -> OrderService:
    """Dependency provider for order service."""
    return OrderService(repository=get_order_repository())
