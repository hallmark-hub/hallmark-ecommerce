import secrets
from datetime import UTC, datetime

from app.core.logging import get_logger
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
from app.repositories.order_repository import (
    OrderReferenceConflictError,
    OrderRepository,
    get_order_repository,
)

logger = get_logger(__name__)

# Excludes look-alike characters so references stay readable over the phone.
_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
_REFERENCE_ATTEMPTS = 5


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

        requested_quantities: dict[str, int] = {}
        for item in request.items:
            requested_quantities[str(item.product_id)] = (
                requested_quantities.get(str(item.product_id), 0) + item.quantity
            )

        order_items: list[dict[str, object]] = []
        subtotal = 0
        for item in request.items:
            product = products_by_id[str(item.product_id)]
            if product["checkout_type"] != CheckoutType.direct:
                raise OrderValidationError("Quote-only products cannot be ordered directly")
            price = product.get("price_pesewas")
            if not isinstance(price, int):
                raise OrderValidationError("Product price is not available")
            _validate_stock(product, requested_quantities[str(item.product_id)])
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
            # "reference" is filled in per attempt below.
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
        created = self._create_with_unique_reference(now, order, order_items)
        return CreateOrderResponse.model_validate(created)

    def _create_with_unique_reference(
        self,
        now: datetime,
        order: dict[str, object],
        order_items: list[dict[str, object]],
    ) -> dict[str, object]:
        """Persist an order, regenerating its reference if one is already taken."""
        for _ in range(_REFERENCE_ATTEMPTS):
            attempt = {**order, "reference": _generate_order_reference(now)}
            try:
                return self.repository.create_order(attempt, order_items)
            except OrderReferenceConflictError:
                logger.warning(
                    "Order reference %s already taken, regenerating",
                    attempt["reference"],
                )
        raise OrderValidationError("Order reference could not be generated")

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


def _validate_stock(product: dict[str, object], quantity: int) -> None:
    """Reject checkout when a product cannot cover the requested quantity."""
    if product.get("in_stock") is False:
        raise OrderValidationError(f"{product['name']} is out of stock")
    available = product.get("stock_qty")
    if isinstance(available, int) and available < quantity:
        raise OrderValidationError(
            f"Only {available} of {product['name']} remain in stock"
        )


def _generate_order_reference(now: datetime) -> str:
    """Return a collision-resistant, human-readable order reference."""
    suffix = "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(6))
    return f"CW-{now:%Y%m%d}-{suffix}"


async def get_order_service() -> OrderService:
    """Dependency provider for order service."""
    return OrderService(repository=get_order_repository())
