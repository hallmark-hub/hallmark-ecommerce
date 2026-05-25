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
