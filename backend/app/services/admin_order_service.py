from app.models.orders import (
    AdminOrderSummary,
    LookupCustomer,
    LookupOrderItem,
    LookupOrderResponse,
    OrderStatus,
)
from app.repositories.order_repository import OrderRepository, get_order_repository


class AdminOrderService:
    """Admin order management logic."""

    def __init__(self, repository: OrderRepository) -> None:
        self.repository = repository

    def list_orders(self, limit: int = 50) -> list[AdminOrderSummary]:
        """Return recent orders for admin views."""
        orders = self.repository.list_orders(limit=limit)
        return [AdminOrderSummary.model_validate(order) for order in orders]

    def get_order(self, reference: str) -> LookupOrderResponse | None:
        """Return one order by reference."""
        order = self.repository.get_order_by_reference(reference)
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

    def update_order_status(
        self,
        reference: str,
        order_status: OrderStatus,
    ) -> AdminOrderSummary | None:
        """Update one order status by reference."""
        order = self.repository.update_order_status(reference, order_status.value)
        return AdminOrderSummary.model_validate(order) if order is not None else None


async def get_admin_order_service() -> AdminOrderService:
    """Dependency provider for admin order service."""
    return AdminOrderService(repository=get_order_repository())
