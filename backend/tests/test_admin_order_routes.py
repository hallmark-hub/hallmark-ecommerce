import asyncio

import httpx

from app.main import app


def request(
    method: str,
    path: str,
    json: dict[str, object] | None = None,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json, headers=headers)

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


def test_admin_can_list_orders() -> None:
    create_order()

    response = request("GET", "/api/v1/admin/orders")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Orders retrieved"
    assert len(payload["data"]) >= 1


def test_admin_can_get_order_by_reference() -> None:
    order = create_order()

    response = request("GET", f"/api/v1/admin/orders/{order['reference']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["reference"] == order["reference"]
    assert payload["data"]["customer"]["phone"] == "+233201987654"


def test_admin_can_update_order_status() -> None:
    order = create_order()

    response = request(
        "PATCH",
        f"/api/v1/admin/orders/{order['reference']}/status",
        json={"order_status": "confirmed"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Order status updated"
    assert payload["data"]["order_status"] == "confirmed"
