import asyncio

import httpx

from app.main import app


def request(
    method: str,
    path: str,
    json: dict[str, object] | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(send())


def create_order() -> dict[str, object]:
    response = request(
        "POST",
        "/api/v1/orders",
        json={
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


def test_initialize_paystack_endpoint_returns_contract_shape() -> None:
    order = create_order()

    response = request(
        "POST",
        "/api/v1/payments/paystack/initialize",
        json={"order_id": order["id"]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Paystack payment initialized"
    assert payload["data"]["reference"] == order["reference"]
    assert payload["data"]["authorization_url"].startswith(
        "https://checkout.paystack.com/"
    )


def test_verify_paystack_endpoint_updates_payment_status() -> None:
    order = create_order()
    init_response = request(
        "POST",
        "/api/v1/payments/paystack/initialize",
        json={"order_id": order["id"]},
    )
    reference = init_response.json()["data"]["reference"]

    response = request("GET", f"/api/v1/payments/paystack/verify/{reference}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["reference"] == reference
    assert payload["data"]["payment_status"] == "paid"


def test_verify_paystack_rejects_unknown_reference() -> None:
    response = request("GET", "/api/v1/payments/paystack/verify/MISSING")

    assert response.status_code == 404
    assert response.json()["message"] == "Payment not found"
