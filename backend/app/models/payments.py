from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel

from app.models.orders import PaymentStatus


class BankCode(StrEnum):
    """Supported manual bank transfer banks."""

    gcb = "gcb"
    stanbic = "stanbic"


class InitializePaystackRequest(BaseModel):
    """Paystack initialization request."""

    order_id: UUID


class BankTransferRequest(BaseModel):
    """Manual bank transfer request."""

    order_id: UUID
    bank: BankCode


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


class BankTransferResponse(BaseModel):
    """Manual bank transfer response."""

    reference: str
    bank_name: str
    branch: str
    account_name: str
    account_number: str
    amount_pesewas: int
    instructions: str
