import hashlib
import hmac
import json
import time
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any

import httpx
import pytest

from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.notification_service import NotificationService
from app.services.order_service import OrderService
from app.services.paystack_service import PaymentValidationError
from app.services.seevcash_service import (
    UNAVAILABLE_MESSAGE,
    HttpSeevcashGateway,
    LocalSeevcashGateway,
    SeevcashGatewayError,
    SeevcashService,
    SeevcashSignatureError,
    _normalize_status,
    verify_webhook_signature,
)

SECRET = "whsec_test"


@pytest.fixture(autouse=True)
def settings(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    stub = SimpleNamespace(frontend_url="https://shop.example/", seevcash_webhook_secret=SECRET)
    monkeypatch.setattr("app.services.seevcash_service.get_settings", lambda: stub)
    return stub


class FakeGateway:
    """Gateway double: sessions start pending and tests move them to a final status."""

    def __init__(self) -> None:
        self.sessions: dict[str, dict[str, Any]] = {}
        self.created: list[dict[str, Any]] = []
        self.fail_create = False
        self.fail_get = False

    def create_session(self, **kwargs: Any) -> dict[str, Any]:
        if self.fail_create:
            raise SeevcashGatewayError("down")
        self.created.append(kwargs)
        reference = f"PAY-{len(self.created)}"
        data = {
            "reference": reference,
            "amount": kwargs["amount_pesewas"],
            "currency": "GHS",
            "status": "pending",
            "expires_at": (datetime.now(UTC) + timedelta(minutes=30)).isoformat(),
        }
        self.sessions[reference] = data
        return {"reference": reference, "checkout_url": f"https://pay.seevplus.com/{reference}", "data": data}

    def get_session(self, reference: str) -> dict[str, Any]:
        if self.fail_get:
            raise SeevcashGatewayError("down")
        data = self.sessions[reference]
        return {"reference": data["reference"], "status": _normalize_status(data["status"]), "data": dict(data)}

    def set_status(self, reference: str, status: str) -> None:
        self.sessions[reference]["status"] = status


class RecordingNotifications(NotificationService):
    def __init__(self) -> None:
        self.receipts: list[str] = []

    def send_order_receipt(self, order: dict[str, Any]) -> bool:
        self.receipts.append(order["reference"])
        return True


def create_service(gateway: Any = None):
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
                "payment_method": "seevcash",
                "accepted_returns_policy": True,
            }
        )
    )
    gateway = gateway or FakeGateway()
    notifications = RecordingNotifications()
    service = SeevcashService(orders, payments, gateway, notifications)
    return service, order, orders, payments, gateway, notifications


def signed(body: dict[str, Any], timestamp: int | None = None, secret: str = SECRET) -> dict[str, Any]:
    raw = json.dumps(body).encode()
    ts = str(int(time.time()) if timestamp is None else timestamp)
    digest = hmac.new(secret.encode(), ts.encode() + b"." + raw, hashlib.sha256).hexdigest()
    return {"raw_body": raw, "timestamp": ts, "signature": f"v1={digest}"}


def webhook_body(reference: str, event: str = "payment.succeeded", status: str = "completed") -> dict[str, Any]:
    return {"id": "evt-1", "event": event, "data": {"transaction": {"reference": reference, "status": status}}}


def test_initialize_opens_a_session_and_stores_seev_reference() -> None:
    service, order, _, payments, gateway, _ = create_service()

    result = service.initialize(str(order.id))

    assert result.authorization_url == "https://pay.seevplus.com/PAY-1"
    assert result.reference == order.reference
    call = gateway.created[0]
    assert call["amount_pesewas"] == order.total_pesewas
    assert call["order_reference"] == order.reference
    assert call["name"] == "Ama Boateng"
    assert call["redirect_url"] == f"https://shop.example/payment/verify?order={order.reference}"
    stored = payments.get_payment_by_reference("PAY-1")
    assert stored["order_id"] == str(order.id)
    assert stored["provider"] == "seevcash"
    assert stored["amount_pesewas"] == order.total_pesewas


def test_initialize_reuses_a_live_session() -> None:
    service, order, _, payments, gateway, _ = create_service()

    first = service.initialize(str(order.id))
    second = service.initialize(str(order.id))

    assert second == first
    assert len(gateway.created) == 1
    assert len(payments.payments) == 1


def test_initialize_replaces_an_expired_session_with_a_new_idempotency_key() -> None:
    service, order, _, payments, gateway, _ = create_service()
    service.initialize(str(order.id))
    payments.payments["PAY-1"]["raw_response"]["expires_at"] = (
        datetime.now(UTC) - timedelta(minutes=1)
    ).isoformat()

    result = service.initialize(str(order.id))

    assert result.authorization_url == "https://pay.seevplus.com/PAY-2"
    keys = [call["idempotency_key"] for call in gateway.created]
    assert keys == [f"charge_{order.reference}_0", f"charge_{order.reference}_1"]


def test_initialize_treats_a_session_without_expiry_as_expired() -> None:
    service, order, _, payments, gateway, _ = create_service()
    service.initialize(str(order.id))
    payments.payments["PAY-1"]["raw_response"] = {}

    service.initialize(str(order.id))

    assert len(gateway.created) == 2


def test_initialize_reconciles_a_session_paid_after_the_customer_left() -> None:
    service, order, orders, _, gateway, notifications = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")

    with pytest.raises(PaymentValidationError, match="already been paid"):
        service.initialize(str(order.id))

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"
    assert len(gateway.created) == 1
    assert notifications.receipts == [order.reference]


def test_initialize_after_a_failed_session_opens_a_new_one_and_reopens_the_order() -> None:
    service, order, orders, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "cancelled")
    assert service.verify(order.reference).payment_status == "failed"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "failed"

    result = service.initialize(str(order.id))

    assert result.authorization_url == "https://pay.seevplus.com/PAY-2"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"


def test_initialize_rejects_orders_for_other_providers_and_paid_orders() -> None:
    service, order, orders, _, _, _ = create_service()
    orders.orders[order.reference]["payment_method"] = "moolre"
    with pytest.raises(PaymentValidationError, match="not SeevCash"):
        service.initialize(str(order.id))

    orders.orders[order.reference]["payment_method"] = "seevcash"
    orders.orders[order.reference]["payment_status"] = "paid"
    with pytest.raises(PaymentValidationError, match="already been paid"):
        service.initialize(str(order.id))

    with pytest.raises(PaymentValidationError, match="Order not found"):
        service.initialize("00000000-0000-4000-8000-000000000000")


def test_gateway_outage_is_reported_without_creating_a_payment() -> None:
    service, order, _, payments, gateway, _ = create_service()
    gateway.fail_create = True

    with pytest.raises(PaymentValidationError, match=UNAVAILABLE_MESSAGE):
        service.initialize(str(order.id))

    assert payments.payments == {}


def test_initialize_does_not_open_a_second_session_when_the_old_one_cannot_be_checked() -> None:
    service, order, _, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.fail_get = True

    with pytest.raises(PaymentValidationError, match=UNAVAILABLE_MESSAGE):
        service.initialize(str(order.id))

    assert len(gateway.created) == 1


def test_verify_marks_order_paid_applies_stock_and_sends_one_receipt() -> None:
    service, order, orders, payments, gateway, notifications = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")

    first = service.verify(order.reference)
    second = service.verify(order.reference)

    assert first.payment_status == "paid"
    assert second.payment_status == "paid"
    stored = orders.get_order_by_id(str(order.id))
    assert stored["payment_status"] == "paid"
    assert stored["stock_applied"] is True
    assert payments.get_payment_by_reference("PAY-1")["status"] == "paid"
    assert notifications.receipts == [order.reference]


def test_verify_accepts_the_success_status_too() -> None:
    service, order, _, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "success")

    assert service.verify(order.reference).payment_status == "paid"


def test_verify_keeps_a_pending_session_pending() -> None:
    service, order, orders, payments, _, notifications = create_service()
    service.initialize(str(order.id))

    assert service.verify(order.reference).payment_status == "pending"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"
    assert payments.get_payment_by_reference("PAY-1")["status"] == "pending"
    assert notifications.receipts == []


def test_a_paid_order_is_never_downgraded_by_a_stale_failed_session() -> None:
    service, order, orders, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "failed")
    service.verify(order.reference)
    service.initialize(str(order.id))
    gateway.set_status("PAY-2", "completed")

    assert service.verify(order.reference).payment_status == "paid"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_verify_rejects_unknown_references_and_other_providers() -> None:
    service, order, orders, _, _, _ = create_service()

    with pytest.raises(PaymentValidationError, match="Payment not found"):
        service.verify("CW-NOPE")
    with pytest.raises(PaymentValidationError, match="Payment not found"):
        service.verify(order.reference)  # order exists but no session was ever opened

    orders.orders[order.reference]["payment_method"] = "moolre"
    with pytest.raises(PaymentValidationError, match="Payment not found"):
        service.verify(order.reference)


def test_verify_reports_an_unreachable_gateway_without_changing_the_order() -> None:
    service, order, orders, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.fail_get = True

    with pytest.raises(PaymentValidationError, match=UNAVAILABLE_MESSAGE):
        service.verify(order.reference)

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"


@pytest.mark.parametrize(
    "overrides",
    [
        {"amount": 1},  # wrong amount
        {"currency": "USD"},
        {"reference": "PAY-OTHER"},
    ],
)
def test_verify_rejects_a_paid_session_that_does_not_match_the_order(overrides: dict[str, Any]) -> None:
    service, order, orders, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")
    gateway.sessions["PAY-1"].update(overrides)

    with pytest.raises(PaymentValidationError):
        service.verify(order.reference)

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"


def test_verify_accepts_an_amount_reported_in_cedis_or_omitted() -> None:
    service, order, _, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")
    gateway.sessions["PAY-1"]["amount"] = order.total_pesewas / 100
    assert service.verify(order.reference).payment_status == "paid"

    service, order, _, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")
    del gateway.sessions["PAY-1"]["amount"]
    assert service.verify(order.reference).payment_status == "paid"


def test_local_gateway_completes_an_order_end_to_end() -> None:
    service, order, orders, _, _, _ = create_service(LocalSeevcashGateway())

    reference = service.initialize(str(order.id)).reference

    assert service.verify(reference).payment_status == "paid"
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_webhook_confirms_payment_through_the_status_api() -> None:
    service, order, orders, payments, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")

    result = service.handle_webhook(**signed(webhook_body("PAY-1")))

    assert result == {"received": True}
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"
    assert payments.payment_events[0]["signature_valid"] is True


def test_webhook_ignores_the_claimed_status_and_dedupes_replays() -> None:
    service, order, orders, payments, _, _ = create_service()
    service.initialize(str(order.id))
    delivery = signed(webhook_body("PAY-1"))

    service.handle_webhook(**delivery)
    service.handle_webhook(**delivery)

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"
    assert len(payments.payment_events) == 1


def test_webhook_for_a_failed_payment_marks_the_order_failed() -> None:
    service, order, orders, _, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "failed")

    service.handle_webhook(**signed(webhook_body("PAY-1", "payment.failed", "failed")))

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "failed"


@pytest.mark.parametrize("tamper", ["body", "secret", "timestamp", "missing"])
def test_webhook_rejects_requests_that_cannot_be_verified(tamper: str) -> None:
    service, order, orders, payments, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")
    delivery = signed(webhook_body("PAY-1"), secret="other" if tamper == "secret" else SECRET)
    if tamper == "body":
        delivery["raw_body"] = delivery["raw_body"] + b" "
    if tamper == "timestamp":
        delivery = signed(webhook_body("PAY-1"), timestamp=int(time.time()) - 3600)
    if tamper == "missing":
        delivery["signature"] = None

    with pytest.raises(SeevcashSignatureError):
        service.handle_webhook(**delivery)

    assert orders.get_order_by_id(str(order.id))["payment_status"] == "pending"
    assert payments.payment_events == []


def test_webhook_is_rejected_when_no_signing_secret_is_configured(settings: SimpleNamespace) -> None:
    settings.seevcash_webhook_secret = ""
    service, *_ = create_service()

    with pytest.raises(SeevcashSignatureError):
        service.handle_webhook(**signed(webhook_body("PAY-1"), secret=""))


def test_webhook_with_unknown_reference_or_other_event_is_accepted() -> None:
    service, _, _, payments, _, _ = create_service()

    assert service.handle_webhook(**signed(webhook_body("PAY-NOPE"))) == {"received": True}
    assert len(payments.payment_events) == 1
    assert service.handle_webhook(**signed(webhook_body("PAY-X", "payout.sent"))) == {"received": True}
    assert len(payments.payment_events) == 1


def test_webhook_with_a_malformed_payload_is_a_validation_error() -> None:
    service, *_ = create_service()

    with pytest.raises(PaymentValidationError):
        service.handle_webhook(**signed({"event": "payment.succeeded"}))


def test_webhook_that_cannot_reach_the_gateway_is_not_recorded_so_a_replay_works() -> None:
    service, order, orders, payments, gateway, _ = create_service()
    service.initialize(str(order.id))
    gateway.set_status("PAY-1", "completed")
    delivery = signed(webhook_body("PAY-1"))

    gateway.fail_get = True
    with pytest.raises(SeevcashGatewayError):
        service.handle_webhook(**delivery)
    assert payments.payment_events == []

    gateway.fail_get = False
    service.handle_webhook(**delivery)
    assert orders.get_order_by_id(str(order.id))["payment_status"] == "paid"


def test_signature_check_matches_the_documented_formula() -> None:
    body = b'{"a":1}'
    now = str(int(time.time()))
    digest = hmac.new(b"s3cret", now.encode() + b"." + body, hashlib.sha256).hexdigest()

    assert verify_webhook_signature("s3cret", now, f"v1={digest}", body) is True
    assert verify_webhook_signature("s3cret", now, digest, body) is False  # missing v1= prefix
    assert verify_webhook_signature("s3cret", "not-a-number", f"v1={digest}", body) is False
    assert verify_webhook_signature("s3cret", now, "v1=é", body) is False  # non-ASCII must not raise


def test_normalize_status_follows_the_documented_values() -> None:
    assert [_normalize_status(s) for s in ["completed", "success", "failed", "cancelled", "pending", None, "x"]] == [
        "success", "success", "failed", "failed", "pending", "pending", "pending",
    ]


def test_http_create_session_sends_the_documented_request(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def fake_post(url: str, **kwargs: Any) -> httpx.Response:
        seen.update(url=url, **kwargs)
        body = {"success": True, "data": {"reference": "PAY-9", "checkout_url": "https://pay.seevplus.com/PAY-9"}}
        return httpx.Response(201, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    gateway = HttpSeevcashGateway("https://api.seevplus.com/api/v1/", "sk_secret")

    session = gateway.create_session(
        name="Ama", email="a@b.com", amount_pesewas=12050, order_reference="CW-1",
        redirect_url="https://shop/payment/verify?order=CW-1", idempotency_key="charge_CW-1_0",
    )

    assert session["reference"] == "PAY-9"
    assert session["checkout_url"] == "https://pay.seevplus.com/PAY-9"
    assert seen["url"] == "https://api.seevplus.com/api/v1/developer/payments"
    assert seen["headers"] == {"Authorization": "Bearer sk_secret", "Idempotency-Key": "charge_CW-1_0"}
    assert seen["json"] == {
        "type": "checkout",
        "amount": 12050,
        "currency": "GHS",
        "recipient": {"name": "Ama", "email": "a@b.com"},
        "channels": ["mobile_money"],
        "redirect_url": "https://shop/payment/verify?order=CW-1",
        "meta": {"order_reference": "CW-1"},
    }


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(502, text='{"error":"gateway down"}'),
        httpx.Response(401, text='{"error":"Invalid API key"}'),
        httpx.Response(202, json={}),  # identical request still in flight
        httpx.Response(201, json={"data": {"reference": "PAY-9"}}),  # no checkout_url
        httpx.Response(201, text="not json"),
    ],
)
def test_http_create_session_failures_become_gateway_errors(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture, response: httpx.Response
) -> None:
    monkeypatch.setattr(httpx, "post", lambda url, **kw: _with_request(response, "POST", url))
    gateway = HttpSeevcashGateway("https://api.seevplus.com/api/v1", "sk_secret")

    with caplog.at_level("ERROR"):
        with pytest.raises(SeevcashGatewayError):
            gateway.create_session(
                name="Ama", email="a@b.com", amount_pesewas=100, order_reference="CW-1",
                redirect_url="https://x", idempotency_key="k",
            )

    assert "sk_secret" not in caplog.text


def test_http_get_session_needs_no_credentials_and_quotes_the_reference(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def fake_get(url: str, **kwargs: Any) -> httpx.Response:
        seen.update(url=url, **kwargs)
        return httpx.Response(
            200, json={"success": True, "data": {"reference": "PAY-1", "status": "completed"}},
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx, "get", fake_get)
    gateway = HttpSeevcashGateway("https://api.seevplus.com/api/v1", "sk_secret")

    session = gateway.get_session("PAY-1/../x")

    assert session["status"] == "success"
    assert seen["url"] == "https://api.seevplus.com/api/v1/developer/payments/PAY-1%2F..%2Fx"
    assert "headers" not in seen


@pytest.mark.parametrize("status_code", [400, 404, 502])
def test_http_get_session_failures_become_gateway_errors(monkeypatch: pytest.MonkeyPatch, status_code: int) -> None:
    monkeypatch.setattr(
        httpx, "get", lambda url, **kw: _with_request(httpx.Response(status_code, text="{}"), "GET", url)
    )
    gateway = HttpSeevcashGateway("https://api.seevplus.com/api/v1", "sk_secret")

    with pytest.raises(SeevcashGatewayError):
        gateway.get_session("PAY-1")


def _with_request(response: httpx.Response, method: str, url: str) -> httpx.Response:
    response.request = httpx.Request(method, url)
    return response
