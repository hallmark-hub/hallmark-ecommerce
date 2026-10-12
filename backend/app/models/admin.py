from pydantic import BaseModel


class AdminAnalyticsResponse(BaseModel):
    """Basic admin analytics response."""

    total_orders: int
    paid_revenue_pesewas: int
    pending_payment_count: int
    orders_by_status: dict[str, int]
    paid_revenue_today_pesewas: int = 0
    paid_revenue_7d_pesewas: int = 0
    paid_revenue_30d_pesewas: int = 0
    quote_requests_total: int = 0
    quote_requests_new: int = 0
