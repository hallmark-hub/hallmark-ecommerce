from datetime import UTC, datetime, timedelta
from typing import Any

from app.services.admin_analytics_service import AdminAnalyticsService


class FakeOrderRepository:
    def __init__(self, orders: list[dict[str, Any]], paid_items: list[dict[str, Any]] | None = None) -> None:
        self.orders = orders
        self.paid_items = paid_items or []

    def list_order_totals(self) -> list[dict[str, Any]]:
        return self.orders

    def list_paid_order_items(self) -> list[dict[str, Any]]:
        return self.paid_items


class FakeQuoteRepository:
    def __init__(self, counts: dict[str, int]) -> None:
        self.counts = counts

    def count_quotes_by_status(self) -> dict[str, int]:
        return self.counts


def order(days_ago: float, total: int, payment: str = "paid", status: str = "confirmed") -> dict[str, Any]:
    return {
        "created_at": (datetime.now(UTC) - timedelta(days=days_ago)).isoformat(),
        "total_pesewas": total,
        "payment_status": payment,
        "order_status": status,
    }


def test_summary_counts_every_order_not_just_the_latest_hundred() -> None:
    orders = [order(60, 1000) for _ in range(150)]
    service = AdminAnalyticsService(FakeOrderRepository(orders), FakeQuoteRepository({}))

    summary = service.get_summary()

    assert summary.total_orders == 150
    assert summary.paid_revenue_pesewas == 150_000


def test_summary_splits_paid_revenue_into_time_windows() -> None:
    orders = [
        order(0, 10_000),
        order(5, 20_000),
        order(20, 40_000),
        order(60, 80_000),
        order(1, 99_999, payment="pending"),
    ]
    service = AdminAnalyticsService(FakeOrderRepository(orders), FakeQuoteRepository({}))

    summary = service.get_summary()

    assert summary.paid_revenue_pesewas == 150_000
    assert summary.paid_revenue_7d_pesewas == 30_000
    assert summary.paid_revenue_30d_pesewas == 70_000
    assert summary.paid_revenue_today_pesewas == 10_000
    assert summary.pending_payment_count == 1


def test_summary_reports_all_quote_requests_and_new_ones() -> None:
    service = AdminAnalyticsService(
        FakeOrderRepository([]),
        FakeQuoteRepository({"received": 7, "contacted": 2, "quoted": 3}),
    )

    summary = service.get_summary()

    assert summary.quote_requests_total == 12
    assert summary.quote_requests_new == 7


def test_summary_breaks_paid_sales_down_by_category() -> None:
    item = lambda order_id, qty, total, name: {"order_id": order_id, "quantity": qty, "line_total_pesewas": total, "category_name": name}
    paid_items = [
        item("o1", 2, 36_000, "Chef Uniforms"),
        item("o1", 1, 9_000, "Chef Uniforms"),
        item("o2", 1, 1_200_000, "Industrial Kitchen Equipment & Tools"),
        item("o3", 3, 54_000, "Chef Uniforms"),
    ]
    service = AdminAnalyticsService(FakeOrderRepository([], paid_items), FakeQuoteRepository({}))

    summary = service.get_summary()

    assert [row.model_dump() for row in summary.sales_by_category] == [
        {"category": "Industrial Kitchen Equipment & Tools", "orders": 1, "units": 1, "revenue_pesewas": 1_200_000},
        {"category": "Chef Uniforms", "orders": 2, "units": 6, "revenue_pesewas": 99_000},
    ]
