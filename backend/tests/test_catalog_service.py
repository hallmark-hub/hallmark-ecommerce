from app.models.catalog import CheckoutType
from app.services.catalog_service import CatalogService


def test_list_categories_matches_contract_seed_count() -> None:
    categories = CatalogService().list_categories()

    assert len(categories) == 8
    assert categories[0].slug == "chef-uniforms"
    assert categories[0].checkout_type == CheckoutType.direct
    assert categories[-1].checkout_type == CheckoutType.quote


def test_list_products_filters_search_and_category() -> None:
    products = CatalogService().list_products(
        category="chef-uniforms",
        search="apron",
        page=1,
        limit=20,
    )

    assert products.total == 1
    assert products.items[0].slug == "chef-apron-with-pocket"


def test_quote_product_allows_nullable_price_with_label() -> None:
    product = CatalogService().get_product_by_slug("full-kitchen-setup-consultation")

    assert product is not None
    assert product.checkout_type == CheckoutType.quote
    assert product.price_pesewas is None
    assert product.price_label == "Request a quote"


class FakeCatalogRepository:
    def list_categories(self) -> list[dict[str, object]]:
        return [
            {
                "id": "00000000-0000-4000-8000-000000000001",
                "name": "Chef Uniforms",
                "slug": "chef-uniforms",
                "description": "Uniforms",
                "checkout_type": "direct",
                "image_url": "https://example.com/category.jpg",
            }
        ]

    def list_products(
        self,
        category: str | None = None,
        search: str | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, object]], int]:
        return (
            [
                {
                    "id": "10000000-0000-4000-8000-000000000001",
                    "name": "Classic White Chef Jacket",
                    "slug": "classic-white-chef-jacket",
                    "description": "Premium cotton chef jacket.",
                    "category_id": "00000000-0000-4000-8000-000000000001",
                    "category_slug": "chef-uniforms",
                    "checkout_type": "direct",
                    "price_pesewas": 15000,
                    "price_label": None,
                    "images": ["https://example.com/product.jpg"],
                    "in_stock": True,
                    "stock_qty": 5,
                    "tags": ["jacket"],
                    "created_at": "2026-05-25T00:00:00Z",
                }
            ],
            1,
        )

    def get_product_by_slug(self, slug: str) -> dict[str, object] | None:
        if slug != "classic-white-chef-jacket":
            return None
        return self.list_products()[0][0]


def test_catalog_service_uses_repository_when_provided() -> None:
    service = CatalogService(repository=FakeCatalogRepository())

    categories = service.list_categories()
    products = service.list_products(page=1, limit=20)
    product = service.get_product_by_slug("classic-white-chef-jacket")

    assert categories[0].slug == "chef-uniforms"
    assert products.total == 1
    assert product is not None
    assert product.price_pesewas == 15000
