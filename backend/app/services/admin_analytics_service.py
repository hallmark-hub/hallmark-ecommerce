from app.models.admin import AdminAnalyticsResponse
from app.models.orders import PaymentStatus
from app.repositories.order_repository import OrderRepository, get_order_repository


class AdminAnalyticsService:
    """Basic admin analytics logic."""

    def __init__(self, repository: OrderRepository) -> None:
        self.repository = repository

    def get_summary(self) -> AdminAnalyticsResponse:
        """Return basic order and revenue analytics."""
        orders = self.repository.list_orders(limit=100)
        orders_by_status: dict[str, int] = {}
        paid_revenue = 0
        pending_payment_count = 0

        for order in orders:
            order_status = str(order["order_status"])
            orders_by_status[order_status] = orders_by_status.get(order_status, 0) + 1
            if order["payment_status"] == PaymentStatus.paid:
                paid_revenue += int(order["total_pesewas"])
            if order["payment_status"] == PaymentStatus.pending:
                pending_payment_count += 1

        return AdminAnalyticsResponse(
            total_orders=len(orders),
            paid_revenue_pesewas=paid_revenue,
            pending_payment_count=pending_payment_count,
            orders_by_status=orders_by_status,
        )


async def get_admin_analytics_service() -> AdminAnalyticsService:
    """Dependency provider for admin analytics service."""
    return AdminAnalyticsService(repository=get_order_repository())
