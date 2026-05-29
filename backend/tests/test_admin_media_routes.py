import asyncio

import httpx

from app.main import app


def upload_image(content: bytes, content_type: str = "image/png") -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                "/api/v1/admin/media/images",
                files={"file": ("product.png", content, content_type)},
            )

    return asyncio.run(send())


def test_admin_image_upload_returns_media_url() -> None:
    response = upload_image(b"fake-png")

    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["secure_url"].startswith(
        "https://res.cloudinary.com/local/image/upload/"
    )
    assert payload["data"]["format"] == "png"


def test_admin_image_upload_rejects_non_image() -> None:
    response = upload_image(b"not-image", "text/plain")

    assert response.status_code == 400
    assert response.json()["message"] == "Only JPEG, PNG, and WebP images are allowed"
