from types import SimpleNamespace

from app.repositories.payment_repository import InMemoryPaymentRepository, SupabasePaymentRepository


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


def test_in_memory_payments_for_an_order_are_newest_first() -> None:
    repository = InMemoryPaymentRepository()
    for order_id, reference in [("order-1", "PAY-1"), ("order-2", "PAY-X"), ("order-1", "PAY-2")]:
        repository.create_payment(
            {
                "order_id": order_id,
                "provider": "seevcash",
                "reference": reference,
                "status": "pending",
                "amount_pesewas": 100,
            }
        )

    payments = repository.get_payments_by_order_id("order-1")

    assert [p["reference"] for p in payments] == ["PAY-2", "PAY-1"]


class _RecordingQuery:
    """Supabase query double that records the filters applied to an update."""

    def __init__(self) -> None:
        self.filters: list[tuple[str, str]] = []

    def update(self, values: dict[str, object]) -> "_RecordingQuery":
        return self

    def eq(self, column: str, value: str) -> "_RecordingQuery":
        self.filters.append((column, value))
        return self

    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=[{"status": "paid"}])


def test_supabase_payment_update_is_not_limited_to_paystack_rows() -> None:
    query = _RecordingQuery()
    repository = SupabasePaymentRepository(SimpleNamespace(table=lambda name: query))  # type: ignore[arg-type]

    repository.update_payment_status("PAY-1", "paid", {})

    assert query.filters == [("reference", "PAY-1")]
