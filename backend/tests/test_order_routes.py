import asyncio

import httpx

from app.main import app


def request(
    method: str,
    path: str,
    json: dict[str, object] | None = None,
    params: dict[str, object] | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json, params=params)

    return asyncio.run(send())


def valid_order_payload() -> dict[str, object]:
    return {
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


def test_create_order_endpoint_returns_contract_shape() -> None:
    response = request("POST", "/api/v1/orders", json=valid_order_payload())

    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Order created"
    assert payload["data"]["subtotal_pesewas"] == 30000
    assert payload["data"]["returns_policy"] == (
        "No refunds. Exchange only within 3 days of purchase."
    )


def test_create_order_requires_returns_policy_acceptance() -> None:
    payload = valid_order_payload()
    payload["accepted_returns_policy"] = False

    response = request("POST", "/api/v1/orders", json=payload)

    assert response.status_code == 422
    assert response.json()["message"] == "Validation failed"


def test_create_order_rejects_quote_only_product() -> None:
    payload = valid_order_payload()
    payload["items"] = [
        {
            "product_id": "10000000-0000-4000-8000-000000000003",
            "quantity": 1,
        }
    ]

    response = request("POST", "/api/v1/orders", json=payload)

    assert response.status_code == 400
    assert response.json() == {
        "success": False,
        "data": None,
        "message": "Quote-only products cannot be ordered directly",
    }


def test_order_lookup_requires_reference_and_matching_phone() -> None:
    create_response = request("POST", "/api/v1/orders", json=valid_order_payload())
    reference = create_response.json()["data"]["reference"]

    lookup_response = request(
        "GET",
        "/api/v1/orders/lookup",
        params={"reference": reference, "phone": "+233201987654"},
    )
    wrong_phone_response = request(
        "GET",
        "/api/v1/orders/lookup",
        params={"reference": reference, "phone": "+233244000000"},
    )

    assert lookup_response.status_code == 200
    assert lookup_response.json()["data"]["reference"] == reference
    assert wrong_phone_response.status_code == 404
    assert wrong_phone_response.json()["message"] == "Order not found"
