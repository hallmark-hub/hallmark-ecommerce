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


def create_order(payment_method: str) -> dict[str, object]:
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
            "payment_method": payment_method,
            "accepted_returns_policy": True,
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


def test_bank_transfer_endpoint_returns_contract_shape() -> None:
    order = create_order("bank_transfer")

    response = request(
        "POST",
        "/api/v1/payments/bank-transfer",
        json={"order_id": order["id"], "bank": "gcb"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Bank transfer instructions retrieved"
    assert payload["data"]["reference"] == order["reference"]
    assert payload["data"]["bank_name"] == "GCB Bank"
    assert payload["data"]["account_number"] == "TBC"
    assert payload["data"]["amount_pesewas"] == 30000


def test_bank_transfer_endpoint_rejects_paystack_order() -> None:
    order = create_order("paystack")

    response = request(
        "POST",
        "/api/v1/payments/bank-transfer",
        json={"order_id": order["id"], "bank": "gcb"},
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Order payment method is not bank transfer"
