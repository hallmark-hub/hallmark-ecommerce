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


def create_quote() -> dict[str, object]:
    response = request(
        "POST",
        "/api/v1/quote-requests",
        json={
            "name": "Kwame Asante",
            "email": "kwame@example.com",
            "phone": "+233244123456",
            "category_slug": "kitchen-setup",
            "message": "We need a kitchen setup quote.",
            "product_ids": [],
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


def test_admin_can_list_quote_requests() -> None:
    quote = create_quote()

    response = request("GET", "/api/v1/admin/quote-requests")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert any(item["reference"] == quote["reference"] for item in payload["data"])


def test_admin_can_get_quote_request_detail() -> None:
    quote = create_quote()

    response = request("GET", f"/api/v1/admin/quote-requests/{quote['reference']}")

    assert response.status_code == 200
    assert response.json()["data"]["message"] == "We need a kitchen setup quote."


def test_admin_can_update_quote_status() -> None:
    quote = create_quote()

    response = request(
        "PATCH",
        f"/api/v1/admin/quote-requests/{quote['reference']}/status",
        json={"status": "contacted"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "contacted"
