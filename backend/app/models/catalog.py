from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class CheckoutType(StrEnum):
    """Supported checkout flow types."""

    direct = "direct"
    quote = "quote"


class Category(BaseModel):
    """Product category response model."""

    id: UUID
    name: str
    slug: str
    description: str
    checkout_type: CheckoutType
    image_url: str


class Product(BaseModel):
    """Product response model."""

    id: UUID
    name: str
    slug: str
    description: str
    category_id: UUID
    category_slug: str
    checkout_type: CheckoutType
    price_pesewas: int | None = Field(ge=0, default=None)
    price_label: str | None = None
    images: list[str]
    in_stock: bool
    stock_qty: int = Field(ge=0)
    tags: list[str]
    created_at: datetime


class ProductList(BaseModel):
    """Paginated product list response model."""

    items: list[Product]
    total: int
    page: int
    limit: int
    pages: int


class AdminProductRequest(BaseModel):
    """Admin product create/update request model."""

    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    description: str = ""
    category_slug: str = Field(min_length=1)
    checkout_type: CheckoutType
    price_pesewas: int | None = Field(ge=0, default=None)
    price_label: str | None = None
    images: list[str] = Field(default_factory=list)
    in_stock: bool = True
    stock_qty: int = Field(ge=0, default=0)
    tags: list[str] = Field(default_factory=list)


class UpdateProductStockRequest(BaseModel):
    """Admin product stock update request model."""

    stock_qty: int = Field(ge=0)
    in_stock: bool


class UpdateProductActiveRequest(BaseModel):
    """Admin product active-state update request model."""

    is_active: bool
