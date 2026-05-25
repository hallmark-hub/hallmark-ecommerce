from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.models.catalog import (
    AdminProductRequest,
    UpdateProductActiveRequest,
    UpdateProductStockRequest,
)
from app.services.admin_product_service import (
    AdminProductError,
    AdminProductService,
    get_admin_product_service,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin-products"],
    dependencies=[Depends(require_admin)],
)


@router.post("/products", status_code=201)
async def create_admin_product(
    request: AdminProductRequest,
    service: Annotated[AdminProductService, Depends(get_admin_product_service)],
) -> dict[str, object]:
    """Create a product for admin management."""
    try:
        product = service.create_product(request)
    except AdminProductError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(product.model_dump(mode="json"), "Product created")


@router.patch("/products/{slug}")
async def update_admin_product(
    slug: str,
    request: AdminProductRequest,
    service: Annotated[AdminProductService, Depends(get_admin_product_service)],
) -> dict[str, object]:
    """Update a product for admin management."""
    try:
        product = service.update_product(slug, request)
    except AdminProductError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(product.model_dump(mode="json"), "Product updated")


@router.patch("/products/{slug}/stock")
async def update_admin_product_stock(
    slug: str,
    request: UpdateProductStockRequest,
    service: Annotated[AdminProductService, Depends(get_admin_product_service)],
) -> dict[str, object]:
    """Update a product inventory for admin management."""
    product = service.update_stock(slug, request)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(product.model_dump(mode="json"), "Product stock updated")


@router.patch("/products/{slug}/active")
async def update_admin_product_active(
    slug: str,
    request: UpdateProductActiveRequest,
    service: Annotated[AdminProductService, Depends(get_admin_product_service)],
) -> dict[str, object]:
    """Update a product active state for admin management."""
    product = service.update_active(slug, request)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(product.model_dump(mode="json"), "Product active state updated")
