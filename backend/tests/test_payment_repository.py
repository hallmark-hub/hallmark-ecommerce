from app.repositories.payment_repository import InMemoryPaymentRepository


def test_in_memory_payment_repository_stores_and_updates_payment() -> None:
    repository = InMemoryPaymentRepository()
    payment = repository.create_payment(
        {
            "order_id": "order-1",
            "provider": "paystack",
            "reference": "CW-20260525-0001",
            "status": "pending",
            "amount_pesewas": 30000,
            "provider_access_code": "access",
            "provider_authorization_url": "https://checkout.paystack.com/access",
            "raw_response": {},
        }
    )

    updated = repository.update_payment_status(
        "CW-20260525-0001",
        "paid",
        {"status": "success"},
    )

    assert payment["id"]
    assert repository.get_payment_by_reference("CW-20260525-0001") is not None
    assert updated is not None
    assert updated["status"] == "paid"
