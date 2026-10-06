import httpx
import pytest

from app.core.config import get_settings
from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.moolre_service import (
    HttpMoolreGateway,
    LocalMoolreGateway,
    MoolreGatewayError,
    MoolreService,
    _cedis_to_pesewas,
    _pesewas_to_cedis,
)
from app.services.notification_service import NotificationService
from app.services.order_service import OrderService
from app.services.paystack_service import PaymentValidationError


class FixedGateway(LocalMoolreGateway):
    """Gateway whose verify result is set by the test."""

    def __init__(self, result: dict[str, object]) -> None:
        self.result = result

    def verify(self, reference: str) -> dict[str, object]:
        return {"reference": reference, **self.result}


def create_service(gateway: LocalMoolreGateway | None = None):
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order = OrderService(repository=orders).create_order(
        CreateOrderRequest.model_validate(
            {
                "customer": {
                    "name": "Ama Boateng",
                    "email": "ama@example.com",
                    "phone": "+233201987654",
                    "delivery_address": "12 Test Street, Accra",
                },
                "items": [{"product_id": "10000000-0000-4000-8000-000000000001", "quantity": 2}],
                "payment_method": "moolre",
                "accepted_returns_policy": True,
            }
        )
    )
    service = MoolreService(orders, payments, gateway or LocalMoolreGateway(), NotificationService())
    return service, order, orders, payments


def test_amount_conversion() -> None:
    assert _pesewas_to_cedis(12050) == "120.50"
    assert _cedis_to_pesewas("120.50") == 12050
    assert _cedis_to_pesewas("1") == 100
    assert _cedis_to_pesewas("abc") is None


def test_initialize_returns_hosted_link_and_is_idempotent() -> None:
    service, order, _, payments = create_service()

    first = service.initialize(str(order.id))
    second = service.initialize(str(order.id))

    assert first.authorization_url.startswith("https://pos.moolre.com/")
    assert second == first
    assert len(payments.payments) == 1


def test_initialize_rejects_paystack_order() -> None:
    service, order, orders, _ = create_service()
    orders.orders[order.reference]["payment_method"] = "paystack"

    with pytest.raises(PaymentValidationError):
        service.initialize(str(order.id))


def test_verify_marks_order_paid() -> None:
    service, order, orders, _ = create_service()
    reference = service.initialize(str(order.id)).reference

    result = service.verify(reference)

    assert result.payment_status == "paid"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_verify_rejects_amount_mismatch() -> None:
    service, order, _, _ = create_service()
    reference = service.initialize(str(order.id)).reference
    service.gateway = FixedGateway(
        {"status": "success", "amount": 1, "account_number": get_settings().moolre_account_number}
    )

    with pytest.raises(PaymentValidationError):
        service.verify(reference)


def test_verify_rejects_wrong_account() -> None:
    service, order, _, _ = create_service()
    reference = service.initialize(str(order.id)).reference
    total = service.payments.get_payment_by_reference(reference)["amount_pesewas"]
    service.gateway = FixedGateway({"status": "success", "amount": total, "account_number": "other"})

    with pytest.raises(PaymentValidationError):
        service.verify(reference)


def test_pending_status_stays_pending() -> None:
    service, order, orders, _ = create_service()
    reference = service.initialize(str(order.id)).reference
    service.gateway = FixedGateway({"status": "pending"})

    assert service.verify(reference).payment_status == "pending"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"


def test_webhook_ignores_claimed_status_and_dedupes() -> None:
    service, order, orders, payments = create_service()
    reference = service.initialize(str(order.id)).reference
    service.gateway = FixedGateway({"status": "pending"})
    payload = {"status": 1, "data": {"externalref": reference, "transactionid": "99", "txstatus": 1}}

    assert service.handle_webhook(payload) == {"received": True}
    assert service.handle_webhook(payload) == {"received": True}

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"
    assert len(payments.payment_events) == 1


def test_webhook_confirms_payment_through_status_check() -> None:
    service, order, orders, _ = create_service()
    reference = service.initialize(str(order.id)).reference

    service.handle_webhook({"data": {"externalref": reference, "transactionid": "1"}})

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_webhook_with_unknown_reference_is_accepted() -> None:
    service, _, _, payments = create_service()

    assert service.handle_webhook({"data": {"externalref": "nope"}}) == {"received": True}
    assert len(payments.payment_events) == 1


def test_failed_callback_verification_is_not_recorded_so_retry_works() -> None:
    service, order, orders, payments = create_service()
    reference = service.initialize(str(order.id)).reference
    good_gateway = service.gateway
    service.gateway = FixedGateway({"status": "success", "amount": 1, "account_number": "x"})
    payload = {"data": {"externalref": reference, "transactionid": "7"}}

    service.handle_webhook(payload)
    assert payments.payment_events == []

    service.gateway = good_gateway
    service.handle_webhook(payload)
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_http_initialize_failure_logs_moolre_response(monkeypatch, caplog) -> None:
    def fake_post(url, **kwargs):
        return httpx.Response(401, text='{"message":"Invalid API key"}', request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    gateway = HttpMoolreGateway("https://api.moolre.com", "user", "key", "1234")

    with caplog.at_level("ERROR"):
        with pytest.raises(MoolreGatewayError):
            gateway.initialize("a@b.com", 1000, "REF1", "https://cb", "https://redirect")

    assert "HTTP 401" in caplog.text
    assert "Invalid API key" in caplog.text
    assert "key" not in caplog.text.replace("Invalid API key", "")
