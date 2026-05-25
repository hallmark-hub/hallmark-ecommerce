from pydantic import BaseModel


class AdminAnalyticsResponse(BaseModel):
    """Basic admin analytics response."""

    total_orders: int
    paid_revenue_pesewas: int
    pending_payment_count: int
    orders_by_status: dict[str, int]
