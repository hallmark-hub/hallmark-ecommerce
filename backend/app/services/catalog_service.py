from math import ceil
from uuid import UUID

from app.models.catalog import Category, CheckoutType, Product, ProductList

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
        "id": "00000000-0000-4000-8000-000000000004",
        "name": "Industrial Kitchen Setup",
        "slug": "kitchen-setup",
        "description": "Consultation and equipment planning for full commercial kitchens.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/kitchen-setup.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000005",
        "name": "Customized Machine Pre-Orders",
        "slug": "machine-preorders",
        "description": "Pre-order customized commercial kitchen machines.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/machine-preorders.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000006",
        "name": "Machine Customization",
        "slug": "machine-customization",
        "description": "Custom machine modifications for hospitality operations.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/machine-customization.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000007",
        "name": "Embroidery Services",
        "slug": "embroidery",
        "description": "Embroidery services for uniforms and branded garments.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/embroidery.jpg",
    },
    {
        "id": "00000000-0000-4000-8000-000000000008",
        "name": "Logo Printing & Garment Branding",
        "slug": "logo-printing-branding",
        "description": "Logo printing and garment branding for teams and businesses.",
        "checkout_type": CheckoutType.quote,
        "image_url": "https://res.cloudinary.com/chefware/categories/logo-printing.jpg",
    },
]

_PRODUCT_DATA = [
    {
        "id": "10000000-0000-4000-8000-000000000001",
        "name": "Classic White Chef Jacket",
        "slug": "classic-white-chef-jacket",
        "description": "Premium cotton chef jacket for professional kitchen teams.",
        "category_id": "00000000-0000-4000-8000-000000000001",
        "category_slug": "chef-uniforms",
        "checkout_type": CheckoutType.direct,
        "price_pesewas": 15000,
        "price_label": None,
        "images": ["https://res.cloudinary.com/chefware/products/chef-jacket.jpg"],
        "in_stock": True,
        "stock_qty": 50,
        "tags": ["jacket", "uniform"],
        "created_at": "2026-05-25T00:00:00Z",
    },
    {
        "id": "10000000-0000-4000-8000-000000000002",
        "name": "Chef Apron with Pocket",
        "slug": "chef-apron-with-pocket",
        "description": "Durable apron with front pocket for daily kitchen use.",
        "category_id": "00000000-0000-4000-8000-000000000001",
        "category_slug": "chef-uniforms",
        "checkout_type": CheckoutType.direct,
        "price_pesewas": 8500,
        "price_label": None,
        "images": ["https://res.cloudinary.com/chefware/products/chef-apron.jpg"],
        "in_stock": True,
        "stock_qty": 80,
        "tags": ["apron", "uniform"],
        "created_at": "2026-05-25T00:00:00Z",
    },
    {
        "id": "10000000-0000-4000-8000-000000000003",
        "name": "Full Kitchen Setup Consultation",
        "slug": "full-kitchen-setup-consultation",
        "description": "Planning support for restaurants building commercial kitchen capacity.",
        "category_id": "00000000-0000-4000-8000-000000000004",
        "category_slug": "kitchen-setup",
        "checkout_type": CheckoutType.quote,
        "price_pesewas": None,
        "price_label": "Request a quote",
        "images": ["https://res.cloudinary.com/chefware/products/kitchen-setup.jpg"],
        "in_stock": True,
        "stock_qty": 1,
        "tags": ["consultation", "setup"],
        "created_at": "2026-05-25T00:00:00Z",
    },
]


class CatalogService:
    """Catalog business logic backed by seed data until Supabase is connected."""

    def list_categories(self) -> list[Category]:
        """Return all product categories."""
        return [Category.model_validate(category) for category in _CATEGORY_DATA]

    def list_products(
        self,
        category: str | None = None,
        search: str | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> ProductList:
        """Return products filtered and paginated according to API query params."""
        products = [Product.model_validate(product) for product in _PRODUCT_DATA]

        if category is not None:
            products = [product for product in products if product.category_slug == category]
        if search is not None:
            needle = search.lower()
            products = [
                product
                for product in products
                if needle in product.name.lower() or needle in product.description.lower()
            ]
        if in_stock is not None:
            products = [product for product in products if product.in_stock is in_stock]

        total = len(products)
        start = (page - 1) * limit
        items = products[start : start + limit]
        pages = ceil(total / limit) if total else 0
        return ProductList(items=items, total=total, page=page, limit=limit, pages=pages)

    def get_product_by_slug(self, slug: str) -> Product | None:
        """Return one product by slug."""
        for product in _PRODUCT_DATA:
            if product["slug"] == slug:
                return Product.model_validate(product)
        return None


async def get_catalog_service() -> CatalogService:
    """Dependency provider for catalog service."""
    return CatalogService()
