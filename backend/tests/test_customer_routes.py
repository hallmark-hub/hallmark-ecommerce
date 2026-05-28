import asyncio

import httpx

from app.main import app


def request(
    method: str,
    path: str,
    json: dict[str, object] | None = None,
    token: str | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        headers = {"Authorization": f"Bearer {token}"} if token else None
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json, headers=headers)

    return asyncio.run(send())


def register_payload(email: str = "customer@example.com") -> dict[str, object]:
    return {
        "name": "Kwame Asante",
        "email": email,
        "phone": "+233244123456",
        "password": "strongpass123",
    }


def test_customer_can_register_login_and_load_profile() -> None:
    email = "customer-one@example.com"
    register_response = request("POST", "/api/v1/auth/register", json=register_payload(email))

    assert register_response.status_code == 201
    auth = register_response.json()["data"]
    assert auth["profile"]["email"] == email
    assert auth["profile"]["role"] == "customer"
    assert auth["access_token"]

    login_response = request(
        "POST",
        "/api/v1/auth/login",
        json={"email": email, "password": "strongpass123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["data"]["access_token"]

    me_response = request("GET", "/api/v1/auth/me", token=token)
    assert me_response.status_code == 200
    assert me_response.json()["data"]["phone"] == "+233244123456"


def test_customer_orders_requires_authentication() -> None:
    response = request("GET", "/api/v1/customer/orders")

    assert response.status_code == 401
    assert response.json()["message"] == "Authentication required"


def test_customer_orders_returns_authenticated_customer_history() -> None:
    email = "customer-orders@example.com"
    register_response = request("POST", "/api/v1/auth/register", json=register_payload(email))
    token = register_response.json()["data"]["access_token"]

    response = request("GET", "/api/v1/customer/orders", token=token)

    assert response.status_code == 200
    assert response.json()["data"] == []
