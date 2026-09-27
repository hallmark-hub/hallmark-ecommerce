from datetime import UTC, datetime
from threading import Lock
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
        self._stock_lock = Lock()

    def get_products_by_ids(self, product_ids: list[str]) -> list[dict[str, Any]]:
        """Return seed products by ID."""
        ids = set(product_ids)
        return [product for product in _PRODUCT_DATA if str(product["id"]) in ids]

    def create_order(
        self,
        order: dict[str, Any],
        items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Create an in-memory order and reserve stock under one lock."""
        with self._stock_lock:
            if order["reference"] in self.orders:
                raise OrderReferenceConflictError("Order reference is already taken")
            quantities = _quantities_by_product(items)
            products = {str(p["id"]): p for p in _PRODUCT_DATA}
            for product_id, quantity in quantities.items():
                product = products.get(product_id)
                if (
                    product is None
                    or product.get("checkout_type") != "direct"
                    or int(product.get("stock_qty", 0)) < quantity
                ):
                    raise OrderPersistenceError("Available stock changed; refresh the cart")
            for product_id, quantity in quantities.items():
                product = products[product_id]
                product["stock_qty"] = int(product["stock_qty"]) - quantity
                product["in_stock"] = product["stock_qty"] > 0
            order = {
                **order,
                "id": str(uuid4()),
                "created_at": datetime.now(UTC),
                "stock_reserved": True,
                "stock_applied": False,
                "stock_reservation_expires_at": datetime.now(UTC).timestamp() + 1800,
            }
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
        """Finalize or safely reacquire stock for a paid order exactly once."""
        order = self.get_order_by_id(order_id)
        if order is None or order.get("stock_applied") or order.get("payment_status") != "paid":
            return False
        with self._stock_lock:
            products = {str(p["id"]): p for p in _PRODUCT_DATA}
            quantities = _quantities_by_product(self.items.get(order["reference"], []))
            if not order.get("stock_reserved"):
                for product_id, quantity in quantities.items():
                    product = products.get(product_id)
                    if product is None or int(product.get("stock_qty", 0)) < quantity:
                        return False
                for product_id, quantity in quantities.items():
                    product = products[product_id]
                    product["stock_qty"] = int(product["stock_qty"]) - quantity
                    product["in_stock"] = product["stock_qty"] > 0
            order["stock_reserved"] = False
            order["stock_applied"] = True
            return True

    def get_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        """Return an in-memory order by ID."""
        now = datetime.now(UTC).timestamp()
        for order in self.orders.values():
            expires_at = order.get("stock_reservation_expires_at")
            if (
                order.get("stock_reserved")
                and isinstance(expires_at, (int, float))
                and expires_at <= now
                and order.get("payment_status") != "paid"
            ):
                self._release_order_reservation(order)
            if str(order["id"]) == order_id:
                return order
        return None

    def _release_order_reservation(self, order: dict[str, Any]) -> None:
        """Return an expired unpaid order's reserved units to available stock."""
        with self._stock_lock:
            if not order.get("stock_reserved"):
                return
            products = {str(p["id"]): p for p in _PRODUCT_DATA}
            for product_id, quantity in _quantities_by_product(
                self.items.get(order["reference"], [])
            ).items():
                product = products.get(product_id)
                if product is not None:
                    product["stock_qty"] = int(product.get("stock_qty", 0)) + quantity
                    product["in_stock"] = True
            order["stock_reserved"] = False

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
        """Create order and item rows atomically while reserving stock."""
        try:
            response = self.client.rpc(
                "create_order_with_items",
                {"p_order": order, "p_items": items},
            ).execute()
        except Exception as exc:
            if _is_unique_violation(exc):
                raise OrderReferenceConflictError(
                    "Order reference is already taken"
                ) from exc
            raise OrderPersistenceError("Order could not be created") from exc
        created = getattr(response, "data", None)
        if not isinstance(created, dict):
            raise OrderPersistenceError("Order could not be created")
        return created

    def lookup_order(self, reference: str, phone: str) -> dict[str, Any] | None:
        """Return an order by reference and customer phone."""
        order_response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_phone,company_name,delivery_address,total_pesewas,"
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
        """Return an order by ID after releasing expired reservations."""
        self.client.rpc("release_expired_order_stock").execute()
        response = (
            self.client.table("orders")
            .select(
                "id,reference,customer_name,customer_email,total_pesewas,payment_method,"
                "payment_status,order_status,stock_reserved,"
                "stock_reservation_expires_at,stock_applied"
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
                "id,reference,customer_name,customer_phone,customer_email,company_name,delivery_address,total_pesewas,"
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
                "id,reference,customer_name,customer_phone,company_name,delivery_address,total_pesewas,"
                "payment_method,payment_status,order_status,returns_policy,stock_applied,created_at"
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


def _quantities_by_product(items: list[dict[str, Any]]) -> dict[str, int]:
    """Sum order-line quantities by product ID."""
    quantities: dict[str, int] = {}
    for item in items:
        product_id = str(item["product_id"])
        quantities[product_id] = quantities.get(product_id, 0) + int(item["quantity"])
    return quantities


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
