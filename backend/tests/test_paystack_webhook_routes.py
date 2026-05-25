import asyncio
import hashlib
import hmac
import json

import httpx

from app.core.config import get_settings
from app.main import app


def request(
    method: str,
    path: str,
    json_body: dict[str, object] | None = None,
    content: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(
                method,
                path,
                json=json_body,
                content=content,
                headers=headers,
            )

    return asyncio.run(send())


def create_order() -> dict[str, object]:
    response = request(
        "POST",
        "/api/v1/orders",
        json_body={
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
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


def initialize_order(order_id: str) -> dict[str, object]:
    response = request(
        "POST",
        "/api/v1/payments/paystack/initialize",
        json_body={"order_id": order_id},
    )
    assert response.status_code == 200
    return response.json()["data"]


def signed_payload(payload: dict[str, object], secret: str) -> tuple[bytes, str]:
    raw_body = json.dumps(payload, separators=(",", ":")).encode()
    signature = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
    return raw_body, signature


def test_paystack_webhook_endpoint_processes_signed_payload(monkeypatch) -> None:
    order = create_order()
    payment = initialize_order(str(order["id"]))
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    payload = {
        "event": "charge.success",
        "data": {"reference": payment["reference"], "status": "success"},
    }
    raw_body, signature = signed_payload(payload, "secret")

    response = request(
        "POST",
        "/api/v1/payments/paystack/webhook",
        content=raw_body,
        headers={
            "content-type": "application/json",
            "x-paystack-signature": signature,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {"received": True},
        "message": "Paystack webhook processed",
    }

    get_settings.cache_clear()


def test_paystack_webhook_endpoint_rejects_bad_signature(monkeypatch) -> None:
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "secret")
    get_settings.cache_clear()
    raw_body, _ = signed_payload({"event": "charge.success"}, "secret")

    response = request(
        "POST",
        "/api/v1/payments/paystack/webhook",
        content=raw_body,
        headers={
            "content-type": "application/json",
            "x-paystack-signature": "bad",
        },
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Invalid Paystack webhook signature"

    get_settings.cache_clear()
