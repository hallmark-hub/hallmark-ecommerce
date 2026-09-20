from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.concurrency import run_in_threadpool

from app.core.rate_limit import rate_limit
from app.core.responses import ok
from app.models.orders import CreateOrderRequest
from app.services.order_service import (
    OrderService,
    OrderValidationError,
    get_order_service,
)
from app.utils.ghana_phone import is_valid_ghana_phone

router = APIRouter(tags=["orders"])


@router.post(
    "/orders",
    status_code=201,
    dependencies=[Depends(rate_limit(limit=15, window_seconds=300))],
)
async def create_order(
    request: CreateOrderRequest,
    service: Annotated[OrderService, Depends(get_order_service)],
) -> dict[str, object]:
    """Create an order before payment initialization."""
    try:
        order = await run_in_threadpool(service.create_order, request)
    except OrderValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(order.model_dump(mode="json"), "Order created")


@router.get("/orders/lookup")
async def lookup_order(
    service: Annotated[OrderService, Depends(get_order_service)],
    reference: Annotated[str, Query(min_length=1)],
    phone: Annotated[str, Query(min_length=1)],
) -> dict[str, object]:
    """Look up order status by reference and customer phone."""
    if not is_valid_ghana_phone(phone):
        raise HTTPException(status_code=400, detail="Phone must be in +233XXXXXXXXX format")

    order = await run_in_threadpool(service.lookup_order, reference, phone)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return ok(order.model_dump(mode="json"), "Order retrieved")
