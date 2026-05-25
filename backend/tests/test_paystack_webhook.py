import hashlib
import hmac
import json

import pytest

from app.core.config import get_settings
from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.order_service import OrderService
from app.services.paystack_service import (
    LocalPaystackGateway,
    PaymentValidationError,
    PaystackService,
    _valid_paystack_signature,
)


def signed_body(payload: dict[str, object], secret: str) -> tuple[bytes, str]:
    raw_body = json.dumps(payload, separators=(",", ":")).encode()
    signature = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
    return raw_body, signature


def create_initialized_service() -> tuple[PaystackService, str, InMemoryOrderRepository, InMemoryPaymentRepository]:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order = OrderService(repository=orders).create_order(
        CreateOrderRequest.model_validate(
            {
                "customer": {
                    "name": "Ama Boateng",
                    "email": "ama@example.com",
                    "phone": "+233201987654",
                },
                "items": [
                    {
                        "product_id": "10000000-0000-4000-8000-000000000001",
                        "quantity": 2,
                    }
                ],
                "payment_method": "paystack",
                "accepted_returns_policy": True,
            }
        )
    )
    service = PaystackService(orders, payments, LocalPaystackGateway())
    initialized = service.initialize(str(order.id))
    return service, initialized.reference, orders, payments


def test_valid_paystack_signature() -> None:
    raw_body, signature = signed_body({"event": "charge.success"}, "secret")

    assert _valid_paystack_signature(raw_body, signature, "secret") is True
    assert _valid_paystack_signature(raw_body, "bad", "secret") is False


def test_handle_webhook_updates_payment_and_order_status(monkeypatch) -> None:
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    service, reference, orders, payments = create_initialized_service()
    payload = {
        "event": "charge.success",
        "data": {"reference": reference, "status": "success", "amount": 30000},
    }
    raw_body, signature = signed_body(payload, "secret")

    result = service.handle_webhook(raw_body, signature, payload)

    payment = payments.get_payment_by_reference(reference)
    assert result == {"received": True}
    assert payment is not None
    assert payment["status"] == "paid"
    assert orders.get_order_by_id(str(payment["order_id"]))["payment_status"] == "paid"
    assert payments.payment_events[0]["signature_valid"] is True

    get_settings.cache_clear()


def test_handle_webhook_rejects_invalid_signature(monkeypatch) -> None:
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    service, reference, _, _ = create_initialized_service()
    payload = {
        "event": "charge.success",
        "data": {"reference": reference, "status": "success"},
    }
    raw_body, _ = signed_body(payload, "secret")

    with pytest.raises(PaymentValidationError, match="Invalid Paystack webhook signature"):
        service.handle_webhook(raw_body, "bad", payload)

    get_settings.cache_clear()


def test_handle_webhook_rejects_amount_mismatch(monkeypatch) -> None:
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    service, reference, _, _ = create_initialized_service()
    payload = {
        "event": "charge.success",
        "data": {"reference": reference, "status": "success", "amount": 1},
    }
    raw_body, signature = signed_body(payload, "secret")

    with pytest.raises(PaymentValidationError, match="amount does not match"):
        service.handle_webhook(raw_body, signature, payload)

    get_settings.cache_clear()


def test_handle_webhook_does_not_downgrade_paid_payment(monkeypatch) -> None:
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    service, reference, _, payments = create_initialized_service()
    success_payload = {
        "event": "charge.success",
        "data": {"reference": reference, "status": "success", "amount": 30000},
    }
    failed_payload = {
        "event": "charge.success",
        "data": {"reference": reference, "status": "failed", "amount": 30000},
    }
    success_body, success_signature = signed_body(success_payload, "secret")
    failed_body, failed_signature = signed_body(failed_payload, "secret")

    service.handle_webhook(success_body, success_signature, success_payload)
    service.handle_webhook(failed_body, failed_signature, failed_payload)

    assert payments.get_payment_by_reference(reference)["status"] == "paid"

    get_settings.cache_clear()
