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


def test_admin_analytics_summary_returns_basic_counts() -> None:
    create_order()

    response = request("GET", "/api/v1/admin/analytics/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Analytics summary retrieved"
    assert payload["data"]["total_orders"] >= 1
    assert payload["data"]["pending_payment_count"] >= 1
    assert "pending" in payload["data"]["orders_by_status"]
