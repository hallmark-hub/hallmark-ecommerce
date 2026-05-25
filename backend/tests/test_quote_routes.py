import asyncio

import httpx

from app.main import app


def post(path: str, json: dict[str, object]) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(path, json=json)

    return asyncio.run(send())


def valid_quote_payload() -> dict[str, object]:
    return {
        "name": "Kwame Asante",
        "email": "kwame@example.com",
        "phone": "+233244123456",
        "category_slug": "kitchen-setup",
        "message": "We need a full kitchen setup for a 60-seat restaurant.",
        "product_ids": ["10000000-0000-4000-8000-000000000003"],
    }


def test_create_quote_request_endpoint_returns_contract_shape() -> None:
    response = post("/api/v1/quote-requests", json=valid_quote_payload())

    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Quote request received"
    assert payload["data"]["reference"].startswith("QR-")
    assert payload["data"]["status"] == "received"


def test_create_quote_request_rejects_direct_category() -> None:
    payload = valid_quote_payload()
    payload["category_slug"] = "chef-uniforms"
    payload["product_ids"] = ["10000000-0000-4000-8000-000000000001"]

    response = post("/api/v1/quote-requests", json=payload)

    assert response.status_code == 400
    assert response.json()["message"] == "Category does not support quote requests"


def test_create_quote_request_validates_phone() -> None:
    payload = valid_quote_payload()
    payload["phone"] = "0244123456"

    response = post("/api/v1/quote-requests", json=payload)

    assert response.status_code == 422
    assert response.json()["message"] == "Validation failed"
