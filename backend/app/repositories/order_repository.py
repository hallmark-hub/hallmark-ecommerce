from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured
from app.services.catalog_service import _PRODUCT_DATA


class OrderRepository(Protocol):
    """Order data access contract."""

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return products needed for order validation."""

    def create_order(
        self,
        order: dict[str, Any],
        items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Persist order and items."""

    def lookup_order(self, reference: str, phone: str) -> dict[str, Any] | None:
        """Return an order by reference and customer phone."""

    def get_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        """Return an order by ID."""

    def update_payment_status(
        self,
        order_id: str,
        payment_status: str,
    ) -> dict[str, Any] | None:
        """Update an order payment status."""

    def list_orders(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return recent orders for admin views."""

    def get_order_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return an order by reference."""

    def update_order_status(
        self,
        reference: str,
        order_status: str,
    ) -> dict[str, Any] | None:
        """Update an order status."""


class InMemoryOrderRepository:
    """Local order repository for tests/dev without Supabase credentials."""

    def __init__(self) -> None:
        self.orders: dict[str, dict[str, Any]] = {}
        self.items: dict[str, list[dict[str, Any]]] = {}

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return seed products by ID."""
        ids = set(product_ids)
        return [product for product in _PRODUCT_DATA if str(product["id"]) in ids]

    def create_order(
        self,
        order: dict[str, Any],
        items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Store order and items in memory."""
        order = {**order, "id": str(uuid4()), "created_at": datetime.now(UTC)}
        self.orders[order["reference"]] = order
        self.items[order["reference"]] = items
        return order

    def lookup_order(self, reference: str, phone: str) -> dict[str, Any] | None:
        """Return an in-memory order by secure lookup keys."""
        order = self.orders.get(reference)
        if order is None or order["customer_phone"] != phone:
            return None
        return {**order, "items": self.items.get(reference, [])}

    def get_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        """Return an in-memory order by ID."""
        for order in self.orders.values():
            if str(order["id"]) == order_id:
                return order
        return None

    def update_payment_status(
        self,
        order_id: str,
        payment_status: str,
    ) -> dict[str, Any] | None:
        """Update an in-memory order payment status."""
        order = self.get_order_by_id(order_id)
        if order is None:
            return None
        order["payment_status"] = payment_status
        return order

    def list_orders(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return recent in-memory orders."""
        orders = sorted(
            self.orders.values(),
            key=lambda order: order["created_at"],
            reverse=True,
        )
        return orders[:limit]

    def get_order_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return an in-memory order by reference."""
        order = self.orders.get(reference)
        if order is None:
            return None
        return {**order, "items": self.items.get(reference, [])}

    def update_order_status(
        self,
        reference: str,
        order_status: str,
    ) -> dict[str, Any] | None:
        """Update an in-memory order status."""
        order = self.orders.get(reference)
        if order is None:
            return None
        order["order_status"] = order_status
        return order


class SupabaseOrderRepository:
    """Order repository backed by Supabase tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return products needed for order validation."""
        if not product_ids:
            return []
        response = (
            self.client.table("products")
            .select("id,name,checkout_type,price_pesewas")
            .eq("is_active", True)
            .in_("id", product_ids)
            .execute()
        )
        return response_data(response)

    def create_order(
        self,
        order: dict[str, Any],
        items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Persist order and items to Supabase."""
        order_response = self.client.table("orders").insert(order).execute()
        rows = response_data(order_response)
        created = rows[0]
        order_id = created["id"]

        order_items = [{**item, "order_id": order_id} for item in items]
        if order_items:
            self.client.table("order_items").insert(order_items).execute()

        return created

    def lookup_order(self, reference: str, phone: str) -> dict[str, Any] | None:
        """Return an order by reference and customer phone."""
        order_response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_phone,total_pesewas,"
                "payment_method,payment_status,order_status,returns_policy,created_at"
            )
            .eq("reference", reference)
            .eq("customer_phone", phone)
            .limit(1)
            .execute()
        )
        orders = response_data(order_response)
        if not orders:
            return None

        order = orders[0]
        items_response = (
            self.client.table("order_items")
            .select("product_name,quantity,unit_price_pesewas")
            .eq("order_id", order["id"])
            .execute()
        )
        return {**order, "items": response_data(items_response)}

    def get_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        """Return an order by ID."""
        response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_email,total_pesewas,payment_method,"
                "payment_status,order_status"
            )
            .eq("id", order_id)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None

    def update_payment_status(
        self,
        order_id: str,
        payment_status: str,
    ) -> dict[str, Any] | None:
        """Update an order payment status."""
        response = (
            self.client.table("orders")
            .update({"payment_status": payment_status})
            .eq("id", order_id)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None

    def list_orders(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return recent orders for admin views."""
        response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_phone,total_pesewas,"
                "payment_method,payment_status,order_status,created_at"
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response_data(response)

    def get_order_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return an order by reference."""
        order_response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_phone,total_pesewas,"
                "payment_method,payment_status,order_status,returns_policy,created_at"
            )
            .eq("reference", reference)
            .limit(1)
            .execute()
        )
        orders = response_data(order_response)
        if not orders:
            return None
        order = orders[0]
        items_response = (
            self.client.table("order_items")
            .select("product_name,quantity,unit_price_pesewas")
            .eq("order_id", order["id"])
            .execute()
        )
        return {**order, "items": response_data(items_response)}

    def update_order_status(
        self,
        reference: str,
        order_status: str,
    ) -> dict[str, Any] | None:
        """Update an order status."""
        response = (
            self.client.table("orders")
            .update({"order_status": order_status})
            .eq("reference", reference)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None


_IN_MEMORY_REPOSITORY = InMemoryOrderRepository()


def get_order_repository() -> OrderRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return _IN_MEMORY_REPOSITORY
    return SupabaseOrderRepository(get_supabase_client())
