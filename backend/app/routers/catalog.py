from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.responses import ok
from app.services.catalog_service import CatalogService, get_catalog_service

router = APIRouter(tags=["catalog"])


@router.get("/categories")
async def list_categories(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> dict[str, object]:
    """Return all product categories."""
    return ok(
        [category.model_dump(mode="json") for category in service.list_categories()],
        "Categories retrieved",
    )


@router.get("/products")
async def list_products(
    service: Annotated[CatalogService, Depends(get_catalog_service)],
    category: str | None = None,
    search: str | None = None,
    in_stock: bool | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict[str, object]:
    """Return products with optional filters and pagination."""
    products = service.list_products(category, search, in_stock, page, limit)
    return ok(products.model_dump(mode="json"), "Products retrieved")


@router.get("/products/{slug}")
async def get_product(
    slug: str,
    service: Annotated[CatalogService, Depends(get_catalog_service)],
) -> dict[str, object]:
    """Return a single product by slug."""
    product = service.get_product_by_slug(slug)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return ok(product.model_dump(mode="json"), "Product retrieved")
