from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured
from app.services.catalog_service import _PRODUCT_DATA


class OrderReferenceConflictError(RuntimeError):
    """Raised when an order reference is already taken."""


class OrderPersistenceError(RuntimeError):
    """Raised when an order could not be persisted."""


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

    def apply_order_stock(self, order_id: str) -> bool:
        """Decrement stock for an order exactly once."""

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
        if order["reference"] in self.orders:
            raise OrderReferenceConflictError("Order reference is already taken")
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

    def apply_order_stock(self, order_id: str) -> bool:
        """Decrement in-memory seed stock for an order exactly once."""
        order = self.get_order_by_id(order_id)
        if order is None or order.get("stock_applied"):
            return False
        order["stock_applied"] = True
        for item in self.items.get(order["reference"], []):
            for product in _PRODUCT_DATA:
                if str(product["id"]) == str(item["product_id"]):
                    product["stock_qty"] = max(
                        int(product["stock_qty"]) - int(item["quantity"]), 0
                    )
                    product["in_stock"] = product["stock_qty"] > 0
        return True

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
            .select("id,name,checkout_type,price_pesewas,in_stock,stock_qty")
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
        try:
            order_response = self.client.table("orders").insert(order).execute()
        except Exception as exc:
            if _is_unique_violation(exc):
                raise OrderReferenceConflictError(
                    "Order reference is already taken"
                ) from exc
            raise OrderPersistenceError("Order could not be created") from exc

        rows = response_data(order_response)
        if not rows:
            raise OrderPersistenceError("Order could not be created")
        created = rows[0]
        order_id = created["id"]

        order_items = [{**item, "order_id": order_id} for item in items]
        if order_items:
            try:
                self.client.table("order_items").insert(order_items).execute()
            except Exception as exc:
                # Supabase has no multi-table transaction here, so roll the
                # order back rather than leave one with no line items.
                self.client.table("orders").delete().eq("id", order_id).execute()
                raise OrderPersistenceError("Order items could not be created") from exc

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

    def apply_order_stock(self, order_id: str) -> bool:
        """Decrement stock for an order exactly once via the database function."""
        response = self.client.rpc(
            "apply_order_stock", {"p_order_id": order_id}
        ).execute()
        return bool(getattr(response, "data", False))

    def get_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        """Return an order by ID."""
        response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_email,total_pesewas,payment_method,"
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


def _is_unique_violation(exc: Exception) -> bool:
    """Return whether a Supabase error is a unique-constraint violation."""
    code = getattr(exc, "code", None)
    if code == "23505":
        return True
    return "duplicate key value" in str(exc).lower()


_IN_MEMORY_REPOSITORY = InMemoryOrderRepository()


def get_order_repository() -> OrderRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return _IN_MEMORY_REPOSITORY
    return SupabaseOrderRepository(get_supabase_client())
