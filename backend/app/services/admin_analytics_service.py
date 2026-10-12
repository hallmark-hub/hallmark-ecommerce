from datetime import UTC, datetime, timedelta
from typing import Any

from app.models.admin import AdminAnalyticsResponse, CategorySales
from app.models.orders import PaymentStatus
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.quote_repository import QuoteRepository, get_quote_repository


def _created_at(order: dict[str, Any]) -> datetime:
    value = order["created_at"]
    parsed = value if isinstance(value, datetime) else datetime.fromisoformat(str(value))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


class AdminAnalyticsService:
    """Basic admin analytics logic."""

    def __init__(self, repository: OrderRepository, quote_repository: QuoteRepository) -> None:
        self.repository = repository
        self.quote_repository = quote_repository

    def get_summary(self) -> AdminAnalyticsResponse:
        """Return order, revenue and quote analytics across all records."""
        orders = self.repository.list_order_totals()
        now = datetime.now(UTC)
        # Ghana is on UTC all year, so "today" starts at UTC midnight
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        orders_by_status: dict[str, int] = {}
        paid_revenue = revenue_today = revenue_7d = revenue_30d = 0
        pending_payment_count = 0

        for order in orders:
            order_status = str(order["order_status"])
            orders_by_status[order_status] = orders_by_status.get(order_status, 0) + 1
            if order["payment_status"] == PaymentStatus.pending:
                pending_payment_count += 1
            if order["payment_status"] != PaymentStatus.paid:
                continue
            total = int(order["total_pesewas"])
            created = _created_at(order)
            paid_revenue += total
            if created >= start_of_day:
                revenue_today += total
            if created >= now - timedelta(days=7):
                revenue_7d += total
            if created >= now - timedelta(days=30):
                revenue_30d += total

        quote_counts = self.quote_repository.count_quotes_by_status()
        sales_by_category = self._sales_by_category(self.repository.list_paid_order_items())
        return AdminAnalyticsResponse(
            total_orders=len(orders),
            paid_revenue_pesewas=paid_revenue,
            pending_payment_count=pending_payment_count,
            orders_by_status=orders_by_status,
            paid_revenue_today_pesewas=revenue_today,
            paid_revenue_7d_pesewas=revenue_7d,
            paid_revenue_30d_pesewas=revenue_30d,
            quote_requests_total=sum(quote_counts.values()),
            quote_requests_new=quote_counts.get("received", 0),
            sales_by_category=sales_by_category,
        )

    @staticmethod
    def _sales_by_category(items: list[dict[str, Any]]) -> list[CategorySales]:
        """Group paid order lines by category, biggest revenue first."""
        groups: dict[str, dict[str, Any]] = {}
        for item in items:
            name = item.get("category_name") or "Uncategorised"
            group = groups.setdefault(name, {"orders": set(), "units": 0, "revenue": 0})
            group["orders"].add(item["order_id"])
            group["units"] += int(item["quantity"])
            group["revenue"] += int(item["line_total_pesewas"])
        rows = [
            CategorySales(category=name, orders=len(g["orders"]), units=g["units"], revenue_pesewas=g["revenue"])
            for name, g in groups.items()
        ]
        return sorted(rows, key=lambda row: row.revenue_pesewas, reverse=True)


async def get_admin_analytics_service() -> AdminAnalyticsService:
    """Dependency provider for admin analytics service."""
    return AdminAnalyticsService(
        repository=get_order_repository(),
        quote_repository=get_quote_repository(),
    )
