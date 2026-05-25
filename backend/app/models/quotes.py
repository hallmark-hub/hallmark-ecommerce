from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.utils.ghana_phone import is_valid_ghana_phone


class QuoteStatus(StrEnum):
    """Supported quote request statuses."""

    received = "received"
    contacted = "contacted"
    quoted = "quoted"
    closed = "closed"


class CreateQuoteRequest(BaseModel):
    """Quote request body."""

    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str
    category_slug: str = Field(min_length=1)
    message: str = Field(min_length=1)
    product_ids: list[UUID] = Field(default_factory=list)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate Ghana phone number format."""
        if not is_valid_ghana_phone(value):
            raise ValueError("Phone must be in +233XXXXXXXXX format")
        return value


class CreateQuoteResponse(BaseModel):
    """Quote request response body."""

    id: UUID
    reference: str
    status: QuoteStatus
