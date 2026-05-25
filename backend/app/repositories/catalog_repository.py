from typing import Any, Protocol

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured


class CatalogRepository(Protocol):
    """Catalog data access contract."""

    def list_categories(self) -> list[dict[str, Any]]:
        """Return active categories."""

    def list_products(
        self,
        category: str | None = None,
        search: str | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """Return active products and total count."""

    def get_product_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return one active product by slug."""


class SupabaseCatalogRepository:
    """Catalog repository backed by Supabase tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def list_categories(self) -> list[dict[str, Any]]:
        """Return active categories ordered for storefront display."""
        response = (
            self.client.table("categories")
            .select("id,name,slug,description,checkout_type,image_url")
            .eq("is_active", True)
            .order("sort_order")
            .execute()
        )
        return response_data(response)

    def list_products(
        self,
        category: str | None = None,
        search: str | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """Return active products filtered and paginated through Supabase."""
        query = self.client.table("products").select(
            "id,name,slug,description,category_id,checkout_type,price_pesewas,"
            "price_label,images,in_stock,stock_qty,tags,created_at,categories(slug)",
            count="exact",
        )
        query = query.eq("is_active", True)

        if category is not None:
            category_id = self._category_id_for_slug(category)
            if category_id is None:
                return [], 0
            query = query.eq("category_id", category_id)
        if search is not None:
            escaped = search.replace("%", "\\%").replace(",", "\\,")
            query = query.or_(f"name.ilike.%{escaped}%,description.ilike.%{escaped}%")
        if in_stock is not None:
            query = query.eq("in_stock", in_stock)

        start = (page - 1) * limit
        end = start + limit - 1
        response = query.order("created_at", desc=True).range(start, end).execute()
        rows = [self._with_category_slug(row) for row in response_data(response)]
        total = getattr(response, "count", None)
        return rows, total if isinstance(total, int) else len(rows)

    def get_product_by_slug(self, slug: str) -> dict[str, Any] | None:
        """Return one active product by slug."""
        response = (
            self.client.table("products")
            .select(
                "id,name,slug,description,category_id,checkout_type,price_pesewas,"
                "price_label,images,in_stock,stock_qty,tags,created_at,categories(slug)"
            )
            .eq("is_active", True)
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        if not rows:
            return None
        return self._with_category_slug(rows[0])

    def _category_id_for_slug(self, slug: str) -> str | None:
        response = (
            self.client.table("categories")
            .select("id")
            .eq("is_active", True)
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return str(rows[0]["id"]) if rows else None

    def _with_category_slug(self, row: dict[str, Any]) -> dict[str, Any]:
        category = row.pop("categories", None)
        if isinstance(category, dict):
            row["category_slug"] = category.get("slug")
        return row


def get_catalog_repository() -> CatalogRepository | None:
    """Return a Supabase catalog repository when credentials are configured."""
    if not supabase_is_configured():
        return None
    return SupabaseCatalogRepository(get_supabase_client())
