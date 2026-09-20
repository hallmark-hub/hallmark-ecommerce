from math import ceil

from app.models.catalog import Category, CheckoutType, Product, ProductList
from app.repositories.catalog_repository import CatalogRepository, get_catalog_repository

_CATEGORY_DATA = [
    {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Chef Uniforms",
        "slug": "chef-uniforms",
        "description": "Premium chef jackets, trousers, aprons, hats, and complete kitchen attire.",
        "checkout_type": CheckoutType.direct,
        "image_url": "https://res.cloudinary.com/chefware/categories/chef-uniforms.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000002",
        "name": "Restaurant Staff Uniforms & Branding",
        "slug": "staff-uniforms-branding",
        "description": "Branded uniforms for front-of-house, service, and hospitality teams.",
        "checkout_type": CheckoutType.direct,
        "image_url": "https://res.cloudinary.com/chefware/categories/staff-uniforms.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000003",
        "name": "Industrial Kitchen Equipment & Tools",
        "slug": "kitchen-equipment-tools",
        "description": "Commercial kitchen equipment, tools, and operational essentials.",
        "checkout_type": CheckoutType.direct,
        "image_url": "https://res.cloudinary.com/chefware/categories/kitchen-equipment.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000010",
        "name": "Uniforms",
        "slug": "uniforms",
        "description": "Quote enquiries for professional and customised hospitality uniforms.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/chef-uniforms.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000011",
        "name": "Branding & Embroidery",
        "slug": "branding-embroidery",
        "description": "T-shirt printing, embroidery and customised branding enquiries.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/embroidery.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000012",
        "name": "Kitchen Equipment",
        "slug": "kitchen-equipment",
        "description": "Sourcing and importation enquiries for commercial kitchen equipment.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/kitchen-equipment.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000004",
        "name": "Kitchen Setup",
        "slug": "kitchen-setup",
        "description": "Consultation and equipment planning for full commercial kitchens.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/kitchen-setup.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000013",
        "name": "Disposables",
        "slug": "disposables",
        "description": "Tissues, bowls, spoons, takeaway packs and other hospitality disposables.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/disposables.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000009",
        "name": "Hospitality Robotics",
        "slug": "robotics",
        "description": "Consultative enquiries for hospitality service, delivery, and cleaning robots.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/robotics.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000014",
        "name": "Other",
        "slug": "other",
        "description": "Other hospitality sourcing requirements not covered by the listed categories.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/other.jpg",
    },
]

# Local admin/repository implementations share this runtime collection. It is
# deliberately empty: sellable products must come from admin-managed data.
_PRODUCT_DATA: list[dict[str, object]] = []


class CatalogService:
    """Catalog business logic backed by the admin-managed product repository."""

    def __init__(self, repository: CatalogRepository | None = None) -> None:
        self.repository = repository

    def list_categories(self) -> list[Category]:
        """Return all product categories."""
        if self.repository is not None:
            return [
                Category.model_validate(category)
                for category in self.repository.list_categories()
            ]
        return self._seed_categories()

    def list_products(
        self,
        category: str | None = None,
        search: str | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> ProductList:
        """Return products filtered and paginated according to API query params."""
        if self.repository is not None:
            rows, total = self.repository.list_products(
                category=category,
                search=search,
                in_stock=in_stock,
                page=page,
                limit=limit,
            )
            pages = ceil(total / limit) if total else 0
            return ProductList(
                items=[Product.model_validate(product) for product in rows],
                total=total,
                page=page,
                limit=limit,
                pages=pages,
            )

        return ProductList(items=[], total=0, page=page, limit=limit, pages=0)

    def get_product_by_slug(self, slug: str) -> Product | None:
        """Return one product by slug."""
        if self.repository is not None:
            row = self.repository.get_product_by_slug(slug)
            return Product.model_validate(row) if row is not None else None

        return None

    def _seed_categories(self) -> list[Category]:
        return [Category.model_validate(category) for category in _CATEGORY_DATA]


async def get_catalog_service() -> CatalogService:
    """Dependency provider for catalog service."""
    return CatalogService(repository=get_catalog_repository())
