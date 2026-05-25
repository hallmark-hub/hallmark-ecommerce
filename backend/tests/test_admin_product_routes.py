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


def product_payload(slug: str = "admin-test-chef-hat") -> dict[str, object]:
    return {
        "name": "Admin Test Chef Hat",
        "slug": slug,
        "description": "A product created by admin tests.",
        "category_slug": "chef-uniforms",
        "checkout_type": "direct",
        "price_pesewas": 5000,
        "price_label": None,
        "images": ["https://example.com/hat.jpg"],
        "in_stock": True,
        "stock_qty": 10,
        "tags": ["hat"],
    }


def test_admin_can_create_product() -> None:
    response = request("POST", "/api/v1/admin/products", json=product_payload())

    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Product created"
    assert payload["data"]["slug"] == "admin-test-chef-hat"


def test_admin_can_update_product() -> None:
    request("POST", "/api/v1/admin/products", json=product_payload("admin-update-hat"))
    payload = product_payload("admin-update-hat")
    payload["name"] = "Updated Chef Hat"

    response = request("PATCH", "/api/v1/admin/products/admin-update-hat", json=payload)

    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Updated Chef Hat"


def test_admin_can_update_product_stock() -> None:
    request("POST", "/api/v1/admin/products", json=product_payload("admin-stock-hat"))

    response = request(
        "PATCH",
        "/api/v1/admin/products/admin-stock-hat/stock",
        json={"stock_qty": 0, "in_stock": False},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["stock_qty"] == 0
    assert data["in_stock"] is False


def test_admin_can_update_product_active_state() -> None:
    request("POST", "/api/v1/admin/products", json=product_payload("admin-active-hat"))

    response = request(
        "PATCH",
        "/api/v1/admin/products/admin-active-hat/active",
        json={"is_active": False},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Product active state updated"
