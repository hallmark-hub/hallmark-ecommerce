from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured
from app.services.catalog_service import _CATEGORY_DATA, _PRODUCT_DATA


class QuoteRepository(Protocol):
    """Quote request data access contract."""

    def get_category_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return one category by slug."""

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return products by IDs."""

    def create_quote_request(
        self,
        quote_request: dict[str, Any],
        product_ids: list[str],
    ) -> dict[str, Any]:
        """Persist a quote request."""


class InMemoryQuoteRepository:
    """Local quote repository for tests/dev without Supabase credentials."""

    def __init__(self) -> None:
        self.quote_requests: dict[str, dict[str, Any]] = {}
        self.product_ids: dict[str, list[str]] = {}

    def get_category_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return one seed category by slug."""
        for category in _CATEGORY_DATA:
            if category["slug"] == slug:
                return category
        return None

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return seed products by IDs."""
        ids = set(product_ids)
        return [product for product in _PRODUCT_DATA if str(product["id"]) in ids]

    def create_quote_request(
        self,
        quote_request: dict[str, Any],
        product_ids: list[str],
    ) -> dict[str, Any]:
        """Store a quote request in memory."""
        quote_request = {
            **quote_request,
            "id": str(uuid4()),
            "created_at": datetime.now(UTC),
        }
        self.quote_requests[quote_request["reference"]] = quote_request
        self.product_ids[quote_request["reference"]] = product_ids
        return quote_request


class SupabaseQuoteRepository:
    """Quote request repository backed by Supabase tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def get_category_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return one active category by slug."""
        response = (
            self.client.table("categories")
            .select("id,slug,checkout_type")
            .eq("is_active", True)
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return active products by IDs."""
        if not product_ids:
            return []
        response = (
            self.client.table("products")
            .select("id,category_id,category_slug:categories(slug),checkout_type")
            .eq("is_active", True)
            .in_("id", product_ids)
            .execute()
        )
        return [self._with_category_slug(row) for row in response_data(response)]

    def create_quote_request(
        self,
        quote_request: dict[str, Any],
        product_ids: list[str],
    ) -> dict[str, Any]:
        """Persist a quote request and selected products to Supabase."""
        response = self.client.table("quote_requests").insert(quote_request).execute()
        rows = response_data(response)
        created = rows[0]
        if product_ids:
            join_rows = [
                {"quote_request_id": created["id"], "product_id": product_id}
                for product_id in product_ids
            ]
            self.client.table("quote_request_products").insert(join_rows).execute()
        return created

    def _with_category_slug(self, row: dict[str, Any]) -> dict[str, Any]:
        category = row.pop("category_slug", None)
        if isinstance(category, dict):
            row["category_slug"] = category.get("slug")
        return row


_IN_MEMORY_REPOSITORY = InMemoryQuoteRepository()


def get_quote_repository() -> QuoteRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return _IN_MEMORY_REPOSITORY
    return SupabaseQuoteRepository(get_supabase_client())
