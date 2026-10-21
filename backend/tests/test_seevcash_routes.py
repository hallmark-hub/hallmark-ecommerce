import asyncio
import hashlib
import hmac
import json
import time
from types import SimpleNamespace
from typing import Any

import httpx
import pytest

from app.main import app
from app.services.notification_service import NotificationService
from app.services.seevcash_service import SeevcashGatewayError, SeevcashService, get_seevcash_service

SECRET = "whsec_test"


@pytest.fixture(autouse=True)
def settings(monkeypatch: pytest.MonkeyPatch) -> None:
    stub = SimpleNamespace(frontend_url="https://shop.example", seevcash_webhook_secret=SECRET, seevcash_api_key="")
    monkeypatch.setattr("app.services.seevcash_service.get_settings", lambda: stub)


def request(method: str, path: str, json_body: dict[str, Any] | None = None, **kwargs: Any) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json_body, **kwargs)

    return asyncio.run(send())


def create_order(payment_method: str = "seevcash") -> dict[str, Any]:
    response = request(
        "POST",
        "/api/v1/orders",
        {
            "customer": {
                "name": "Ama Boateng",
                "email": "ama@example.com",
                "phone": "+233201987654",
                "delivery_address": "12 Test Street, Accra",
            },
            "items": [{"product_id": "10000000-0000-4000-8000-000000000001", "quantity": 1}],
            "payment_method": payment_method,
            "accepted_returns_policy": True,
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


def webhook(reference: str, secret: str = SECRET, signature: str | None = None) -> httpx.Response:
    body = json.dumps({"event": "payment.succeeded", "data": {"transaction": {"reference": reference}}}).encode()
    timestamp = str(int(time.time()))
    digest = hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
    headers = {"X-Seev-Timestamp": timestamp, "Content-Type": "application/json"}
    if signature != "":
        headers["X-Seev-Signature"] = signature or f"v1={digest}"
    return request("POST", "/api/v1/payments/seevcash/webhook", content=body, headers=headers)


def test_initialize_then_verify_pays_the_order() -> None:
    order = create_order()

    init = request("POST", "/api/v1/payments/seevcash/initialize", {"order_id": order["id"]})

    assert init.status_code == 200
    payload = init.json()
    assert payload["success"] is True
    assert payload["message"] == "SeevCash payment initialized"
    assert payload["data"]["reference"] == order["reference"]
    assert payload["data"]["authorization_url"].startswith("https://pay.seevplus.com/")

    verify = request("GET", f"/api/v1/payments/seevcash/verify/{order['reference']}")

    assert verify.status_code == 200
    assert verify.json()["data"]["payment_status"] == "paid"
    assert verify.json()["data"]["order_id"] == order["id"]


def test_initialize_rejects_an_order_for_another_provider() -> None:
    order = create_order("paystack")

    response = request("POST", "/api/v1/payments/seevcash/initialize", {"order_id": order["id"]})

    assert response.status_code == 400


def test_verify_unknown_reference_is_404() -> None:
    assert request("GET", "/api/v1/payments/seevcash/verify/CW-NOPE").status_code == 404


def test_webhook_with_a_valid_signature_is_accepted() -> None:
    response = webhook("PAY-UNKNOWN")

    assert response.status_code == 200
    assert response.json()["data"] == {"received": True}


@pytest.mark.parametrize("kwargs", [{"secret": "wrong"}, {"signature": ""}, {"signature": "v1=deadbeef"}])
def test_webhook_that_cannot_be_verified_is_401(kwargs: dict[str, str]) -> None:
    assert webhook("PAY-UNKNOWN", **kwargs).status_code == 401


def test_webhook_is_503_when_payment_status_cannot_be_confirmed() -> None:
    order = create_order()
    request("POST", "/api/v1/payments/seevcash/initialize", {"order_id": order["id"]})
    real = asyncio.run(get_seevcash_service())
    payment = real.payments.get_payments_by_order_id(order["id"])[0]

    class Down:
        def get_session(self, reference: str) -> dict[str, Any]:
            raise SeevcashGatewayError("down")

    async def down_service() -> SeevcashService:
        return SeevcashService(real.orders, real.payments, Down(), NotificationService())  # type: ignore[arg-type]

    app.dependency_overrides[get_seevcash_service] = down_service
    try:
        response = webhook(payment["reference"])
    finally:
        app.dependency_overrides.pop(get_seevcash_service)

    assert response.status_code == 503
