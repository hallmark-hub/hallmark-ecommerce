from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.utils.ghana_phone import is_valid_ghana_phone


RETURNS_POLICY = "No refunds. Exchange only within 3 days of purchase."


class PaymentMethod(StrEnum):
    """Supported payment methods."""

    paystack = "paystack"
    bank_transfer = "bank_transfer"


class PaymentStatus(StrEnum):
    """Supported payment statuses."""

    pending = "pending"
    paid = "paid"
    failed = "failed"


class OrderStatus(StrEnum):
    """Supported order statuses."""

    pending = "pending"
    confirmed = "confirmed"
    delivered = "delivered"


class CustomerInput(BaseModel):
    """Checkout customer request data."""

    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate Ghana phone number format."""
        if not is_valid_ghana_phone(value):
            raise ValueError("Phone must be in +233XXXXXXXXX format")
        return value


class OrderItemInput(BaseModel):
    """Checkout item request data."""

    product_id: UUID
    quantity: int = Field(gt=0)


class CreateOrderRequest(BaseModel):
    """Create order request model."""

    customer: CustomerInput
    items: list[OrderItemInput] = Field(min_length=1)
    payment_method: PaymentMethod
    accepted_returns_policy: bool

    @field_validator("accepted_returns_policy")
    @classmethod
    def validate_returns_policy(cls, value: bool) -> bool:
        """Require checkout returns policy acceptance."""
        if value is not True:
            raise ValueError("Returns policy must be accepted")
        return value


class CreateOrderResponse(BaseModel):
    """Create order response model."""

    id: UUID
    reference: str
    subtotal_pesewas: int
    total_pesewas: int
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    order_status: OrderStatus
    returns_policy: str
    created_at: datetime


class LookupCustomer(BaseModel):
    """Customer data returned by order lookup."""

    name: str
    phone: str


class LookupOrderItem(BaseModel):
    """Order item data returned by order lookup."""

    product_name: str
    quantity: int
    unit_price_pesewas: int


class LookupOrderResponse(BaseModel):
    """Order lookup response model."""

    id: UUID
    reference: str
    customer: LookupCustomer
    items: list[LookupOrderItem]
    total_pesewas: int
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    order_status: OrderStatus
    returns_policy: str
    created_at: datetime
