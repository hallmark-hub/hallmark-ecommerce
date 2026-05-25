from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.models.orders import UpdateOrderStatusRequest
from app.services.admin_order_service import AdminOrderService, get_admin_order_service

router = APIRouter(
    prefix="/admin",
    tags=["admin-orders"],
    dependencies=[Depends(require_admin)],
)


@router.get("/orders")
async def list_admin_orders(
    service: Annotated[AdminOrderService, Depends(get_admin_order_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> dict[str, object]:
    """Return recent orders for admin management."""
    orders = service.list_orders(limit=limit)
    return ok([order.model_dump(mode="json") for order in orders], "Orders retrieved")


@router.get("/orders/{reference}")
async def get_admin_order(
    reference: str,
    service: Annotated[AdminOrderService, Depends(get_admin_order_service)],
) -> dict[str, object]:
    """Return one order by reference for admin management."""
    order = service.get_order(reference)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok(order.model_dump(mode="json"), "Order retrieved")


@router.patch("/orders/{reference}/status")
async def update_admin_order_status(
    reference: str,
    request: UpdateOrderStatusRequest,
    service: Annotated[AdminOrderService, Depends(get_admin_order_service)],
) -> dict[str, object]:
    """Update an order status for admin management."""
    order = service.update_order_status(reference, request.order_status)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok(order.model_dump(mode="json"), "Order status updated")
