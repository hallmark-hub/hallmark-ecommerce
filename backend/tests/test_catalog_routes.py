import asyncio

import httpx

from app.main import app


def get(path: str, params: dict[str, object] | None = None) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(path, params=params)

    return asyncio.run(request())


def test_categories_endpoint_returns_contract_shape() -> None:
    response = get("/api/v1/categories")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Categories retrieved"
    assert payload["data"][0]["slug"] == "chef-uniforms"


def test_products_endpoint_filters_and_paginates() -> None:
    response = get("/api/v1/products", params={"category": "chef-uniforms", "limit": 1})

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["limit"] == 1
    assert data["pages"] == 2
    assert len(data["items"]) == 1


def test_get_product_not_found_uses_error_envelope() -> None:
    response = get("/api/v1/products/missing-product")

    assert response.status_code == 404
    assert response.json() == {
        "success": False,
        "data": None,
        "message": "Product not found",
    }


def test_validation_errors_use_error_envelope() -> None:
    response = get("/api/v1/products", params={"limit": 101})

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert "errors" in payload["data"]
