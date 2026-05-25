from app.models.catalog import (
    AdminProductRequest,
    Product,
    UpdateProductActiveRequest,
    UpdateProductStockRequest,
)
from app.repositories.admin_product_repository import (
    AdminProductRepository,
    get_admin_product_repository,
)


class AdminProductError(ValueError):
    """Raised when admin product changes fail."""


class AdminProductService:
    """Admin product management logic."""

    def __init__(self, repository: AdminProductRepository) -> None:
        self.repository = repository

    def create_product(self, request: AdminProductRequest) -> Product:
        """Create a product."""
        try:
            row = self.repository.create_product(request.model_dump(mode="json"))
        except ValueError as exc:
            raise AdminProductError(str(exc)) from exc
        return Product.model_validate(row)

    def update_product(self, slug: str, request: AdminProductRequest) -> Product | None:
        """Update a product by slug."""
        try:
            row = self.repository.update_product(slug, request.model_dump(mode="json"))
        except ValueError as exc:
            raise AdminProductError(str(exc)) from exc
        return Product.model_validate(row) if row is not None else None

    def update_stock(
        self,
        slug: str,
        request: UpdateProductStockRequest,
    ) -> Product | None:
        """Update product stock."""
        row = self.repository.update_stock(slug, request.stock_qty, request.in_stock)
        return Product.model_validate(row) if row is not None else None

    def update_active(
        self,
        slug: str,
        request: UpdateProductActiveRequest,
    ) -> Product | None:
        """Update product active state."""
        row = self.repository.update_active(slug, request.is_active)
        return Product.model_validate(row) if row is not None else None


async def get_admin_product_service() -> AdminProductService:
    """Dependency provider for admin product service."""
    return AdminProductService(repository=get_admin_product_repository())
