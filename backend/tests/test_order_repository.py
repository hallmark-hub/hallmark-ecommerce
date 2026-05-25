from app.repositories.order_repository import InMemoryOrderRepository


def test_in_memory_order_repository_stores_and_secures_lookup() -> None:
    repository = InMemoryOrderRepository()
    order = {
        "reference": "CW-20260525-0001",
        "customer_name": "Ama Boateng",
        "customer_email": "ama@example.com",
        "customer_phone": "+233201987654",
        "subtotal_pesewas": 15000,
        "total_pesewas": 15000,
        "payment_method": "paystack",
        "payment_status": "pending",
        "order_status": "pending",
        "returns_policy": "No refunds. Exchange only within 3 days of purchase.",
        "accepted_returns_policy": True,
    }
    items = [
        {
            "product_id": "10000000-0000-4000-8000-000000000001",
            "product_name": "Classic White Chef Jacket",
            "quantity": 1,
            "unit_price_pesewas": 15000,
            "line_total_pesewas": 15000,
        }
    ]

    created = repository.create_order(order, items)
    found = repository.lookup_order("CW-20260525-0001", "+233201987654")
    hidden = repository.lookup_order("CW-20260525-0001", "+233244000000")

    assert created["id"]
    assert found is not None
    assert found["items"] == items
    assert hidden is None


def test_in_memory_order_repository_returns_seed_products_by_id() -> None:
    repository = InMemoryOrderRepository()

    products = repository.get_products_by_ids(["10000000-0000-4000-8000-000000000001"])

    assert len(products) == 1
    assert products[0]["slug"] == "classic-white-chef-jacket"
