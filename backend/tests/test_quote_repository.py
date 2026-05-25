from app.repositories.quote_repository import InMemoryQuoteRepository


def test_in_memory_quote_repository_stores_quote_request() -> None:
    repository = InMemoryQuoteRepository()
    quote_request = {
        "reference": "QR-20260525-0001",
        "name": "Kwame Asante",
        "email": "kwame@example.com",
        "phone": "+233244123456",
        "category_id": "00000000-0000-4000-8000-000000000004",
        "category_slug": "kitchen-setup",
        "message": "Need a full setup.",
        "status": "received",
        "notification_attempted": False,
        "notification_sent": False,
    }

    created = repository.create_quote_request(
        quote_request,
        ["10000000-0000-4000-8000-000000000003"],
    )

    assert created["id"]
    assert repository.quote_requests["QR-20260525-0001"]["status"] == "received"
    assert repository.product_ids["QR-20260525-0001"] == [
        "10000000-0000-4000-8000-000000000003"
    ]


def test_in_memory_quote_repository_returns_seed_category_and_products() -> None:
    repository = InMemoryQuoteRepository()

    category = repository.get_category_by_slug("kitchen-setup")
    products = repository.get_products_by_ids(["10000000-0000-4000-8000-000000000003"])

    assert category is not None
    assert category["checkout_type"] == "quote"
    assert len(products) == 1
    assert products[0]["category_slug"] == "kitchen-setup"
