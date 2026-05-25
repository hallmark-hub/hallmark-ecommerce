from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured
from app.services.catalog_service import _CATEGORY_DATA, _PRODUCT_DATA


class AdminProductRepository(Protocol):
    """Admin product data access contract."""

    def create_product(self, product: dict[str, Any]) -> dict[str, Any]:
        """Create a product."""

    def update_product(self, slug: str, product: dict[str, Any]) -> dict[str, Any] | None:
        """Update a product by slug."""

    def update_stock(
        self,
        slug: str,
        stock_qty: int,
        in_stock: bool,
    ) -> dict[str, Any] | None:
        """Update product inventory."""

    def update_active(self, slug: str, is_active: bool) -> dict[str, Any] | None:
        """Update product active state."""


class InMemoryAdminProductRepository:
    """Local admin product repository for tests/dev without Supabase credentials."""

    def create_product(self, product: dict[str, Any]) -> dict[str, Any]:
        """Create a product in seed data."""
        category = self._category_by_slug(product["category_slug"])
        row = {
            **product,
            "id": str(uuid4()),
            "category_id": category["id"],
            "created_at": datetime.now(UTC),
            "is_active": True,
        }
        _PRODUCT_DATA.append(row)
        return row

    def update_product(self, slug: str, product: dict[str, Any]) -> dict[str, Any] | None:
        """Update a product in seed data."""
        row = self._product_by_slug(slug)
        if row is None:
            return None
        category = self._category_by_slug(product["category_slug"])
        row.update({**product, "category_id": category["id"]})
        return row

    def update_stock(
        self,
        slug: str,
        stock_qty: int,
        in_stock: bool,
    ) -> dict[str, Any] | None:
        """Update product inventory in seed data."""
        row = self._product_by_slug(slug)
        if row is None:
            return None
        row.update({"stock_qty": stock_qty, "in_stock": in_stock})
        return row

    def update_active(self, slug: str, is_active: bool) -> dict[str, Any] | None:
        """Update product active state in seed data."""
        row = self._product_by_slug(slug)
        if row is None:
            return None
        row["is_active"] = is_active
        return row

    def _category_by_slug(self, slug: str) -> dict[str, Any]:
        for category in _CATEGORY_DATA:
            if category["slug"] == slug:
                return category
        raise ValueError("Category not found")

    def _product_by_slug(self, slug: str) -> dict[str, Any] | None:
        for product in _PRODUCT_DATA:
            if product["slug"] == slug:
                return product
        return None


class SupabaseAdminProductRepository:
    """Admin product repository backed by Supabase tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def create_product(self, product: dict[str, Any]) -> dict[str, Any]:
        """Create a product."""
        row = self._to_db_row(product)
        response = self.client.table("products").insert(row).execute()
        rows = response_data(response)
        return self._with_category_slug(rows[0], product["category_slug"])

    def update_product(self, slug: str, product: dict[str, Any]) -> dict[str, Any] | None:
        """Update a product by slug."""
        row = self._to_db_row(product)
        response = self.client.table("products").update(row).eq("slug", slug).execute()
        rows = response_data(response)
        return self._with_category_slug(rows[0], product["category_slug"]) if rows else None

    def update_stock(
        self,
        slug: str,
        stock_qty: int,
        in_stock: bool,
    ) -> dict[str, Any] | None:
        """Update product inventory."""
        response = (
            self.client.table("products")
            .update({"stock_qty": stock_qty, "in_stock": in_stock})
            .eq("slug", slug)
            .execute()
        )
        rows = response_data(response)
        return self._product_with_category_slug(slug) if rows else None

    def update_active(self, slug: str, is_active: bool) -> dict[str, Any] | None:
        """Update product active state."""
        response = (
            self.client.table("products")
            .update({"is_active": is_active})
            .eq("slug", slug)
            .execute()
        )
        rows = response_data(response)
        return self._product_with_category_slug(slug) if rows else None

    def _to_db_row(self, product: dict[str, Any]) -> dict[str, Any]:
        category_id = self._category_id_for_slug(product["category_slug"])
        row = {key: value for key, value in product.items() if key != "category_slug"}
        row["category_id"] = category_id
        return row

    def _category_id_for_slug(self, slug: str) -> str:
        response = (
            self.client.table("categories")
            .select("id")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        if not rows:
            raise ValueError("Category not found")
        return str(rows[0]["id"])

    def _product_with_category_slug(self, slug: str) -> dict[str, Any] | None:
        response = (
            self.client.table("products")
            .select(
                "id,name,slug,description,category_id,checkout_type,price_pesewas,"
                "price_label,images,in_stock,stock_qty,tags,created_at,categories(slug)"
            )
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        if not rows:
            return None
        category = rows[0].pop("categories", {})
        return self._with_category_slug(rows[0], category.get("slug"))

    def _with_category_slug(
        self,
        row: dict[str, Any],
        category_slug: str | None,
    ) -> dict[str, Any]:
        row["category_slug"] = category_slug
        return row


def get_admin_product_repository() -> AdminProductRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return InMemoryAdminProductRepository()
    return SupabaseAdminProductRepository(get_supabase_client())
