import asyncio

import httpx

from app.core.config import get_settings
from app.main import app
from app.repositories.customer_repository import _IN_MEMORY_REPOSITORY


def request(method: str, path: str, json: dict[str, object] | None = None) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(send())


def register(email: str, password: str = "strongpass123") -> str:
    response = request(
        "POST",
        "/api/v1/auth/register",
        json={"name": "Ama Owusu", "email": email, "phone": "+233244123456", "password": password},
    )
    assert response.status_code == 201
    return response.json()["data"]["access_token"]


def test_forgot_password_sends_reset_link_to_frontend_reset_page() -> None:
    email = "reset-link@example.com"
    register(email)

    response = request("POST", "/api/v1/auth/forgot-password", json={"email": email})

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert _IN_MEMORY_REPOSITORY.password_reset_requests[-1] == {
        "email": email,
        "redirect_to": f"{get_settings().frontend_url}/reset-password",
    }


def test_forgot_password_does_not_reveal_unknown_emails() -> None:
    known = request("POST", "/api/v1/auth/forgot-password", json={"email": "reset-link@example.com"})
    unknown = request("POST", "/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})

    assert unknown.status_code == known.status_code == 200
    assert unknown.json()["message"] == known.json()["message"]


def test_reset_password_with_recovery_token_replaces_password() -> None:
    email = "reset-me@example.com"
    token = register(email, password="oldpassword1")

    response = request(
        "POST",
        "/api/v1/auth/reset-password",
        json={"access_token": token, "password": "newpassword1"},
    )

    assert response.status_code == 200
    old_login = request("POST", "/api/v1/auth/login", json={"email": email, "password": "oldpassword1"})
    new_login = request("POST", "/api/v1/auth/login", json={"email": email, "password": "newpassword1"})
    assert old_login.status_code == 401
    assert new_login.status_code == 200


def test_reset_password_rejects_invalid_token() -> None:
    response = request(
        "POST",
        "/api/v1/auth/reset-password",
        json={"access_token": "not-a-real-token", "password": "newpassword1"},
    )

    assert response.status_code == 400
    assert response.json()["message"] == "This reset link is invalid or has expired."


def test_reset_password_requires_eight_characters() -> None:
    response = request(
        "POST",
        "/api/v1/auth/reset-password",
        json={"access_token": "anything", "password": "short"},
    )

    assert response.status_code == 422
