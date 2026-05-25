from uuid import UUID

from pydantic import BaseModel

from app.models.orders import PaymentStatus


class InitializePaystackRequest(BaseModel):
    """Paystack initialization request."""

    order_id: UUID


class InitializePaystackResponse(BaseModel):
    """Paystack initialization response."""

    authorization_url: str
    access_code: str
    reference: str


class VerifyPaystackResponse(BaseModel):
    """Paystack verification response."""

    reference: str
    payment_status: PaymentStatus
    order_id: UUID
