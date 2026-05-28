from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.orders import OrderStatus, PaymentMethod, PaymentStatus
from app.utils.ghana_phone import is_valid_ghana_phone


class CustomerRole(StrEnum):
    """Supported account roles."""

    customer = "customer"
    admin = "admin"


class CustomerRegisterRequest(BaseModel):
    """Customer registration request."""

    name: str = Field(min_length=1)
    email: EmailStr
    phone: str
    password: str = Field(min_length=8)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate Ghana phone number format."""
        if not is_valid_ghana_phone(value):
            raise ValueError("Phone must be in +233XXXXXXXXX format")
        return value


class CustomerLoginRequest(BaseModel):
    """Customer login request."""

    email: EmailStr
    password: str = Field(min_length=1)


class CustomerUser(BaseModel):
    """Authenticated Supabase user summary."""

    id: UUID
    email: EmailStr


class CustomerProfile(BaseModel):
    """Customer profile response."""

    id: UUID
    auth_user_id: UUID
    name: str
    email: EmailStr
    phone: str
    role: CustomerRole
    created_at: datetime
    updated_at: datetime


class CustomerAuthResponse(BaseModel):
    """Customer auth response with optional session tokens."""

    access_token: str | None
    refresh_token: str | None
    user: CustomerUser
    profile: CustomerProfile


class CustomerOrderSummary(BaseModel):
    """Customer order history item."""

    id: UUID
    reference: str
    total_pesewas: int
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    order_status: OrderStatus
    returns_policy: str
    created_at: datetime
