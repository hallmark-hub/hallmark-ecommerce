from hashlib import sha1
from time import time
from typing import Any, Protocol
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.models.media import MediaUploadResponse


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class MediaUploadError(ValueError):
    """Raised when a media upload cannot be completed."""


class MediaStorage(Protocol):
    """Media storage boundary."""

    def upload_image(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> dict[str, Any]:
        """Upload an image and return storage metadata."""


class LocalMediaStorage:
    """Local deterministic media storage for tests/dev without Cloudinary credentials."""

    def upload_image(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> dict[str, Any]:
        """Return a deterministic local placeholder URL."""
        public_id = f"chefware/products/local-{uuid4()}"
        return {
            "secure_url": f"https://res.cloudinary.com/local/image/upload/{public_id}",
            "public_id": public_id,
            "bytes": len(content),
            "format": _format_from_content_type(content_type),
        }


class CloudinaryMediaStorage:
    """Cloudinary image storage using signed server-side uploads."""

    def __init__(self, cloud_name: str, api_key: str, api_secret: str) -> None:
        self.cloud_name = cloud_name
        self.api_key = api_key
        self.api_secret = api_secret

    def upload_image(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> dict[str, Any]:
        """Upload an image to Cloudinary."""
        timestamp = int(time())
        params = {
            "folder": "chefware/products",
            "timestamp": timestamp,
        }
        signature = _cloudinary_signature(params, self.api_secret)
        try:
            response = httpx.post(
                f"https://api.cloudinary.com/v1_1/{self.cloud_name}/image/upload",
                data={
                    **params,
                    "api_key": self.api_key,
                    "signature": signature,
                },
                files={"file": (filename, content, content_type)},
                timeout=30,
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise MediaUploadError("Cloudinary image upload failed") from exc

        try:
            return {
                "secure_url": payload["secure_url"],
                "public_id": payload["public_id"],
                "bytes": payload.get("bytes", len(content)),
                "format": payload.get("format"),
            }
        except KeyError as exc:
            raise MediaUploadError("Cloudinary image upload returned an invalid response") from exc


class MediaService:
    """Media upload business logic."""

    def __init__(self, storage: MediaStorage) -> None:
        self.storage = storage

    def upload_product_image(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> MediaUploadResponse:
        """Validate and upload a product image."""
        settings = get_settings()
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise MediaUploadError("Only JPEG, PNG, and WebP images are allowed")
        if not content:
            raise MediaUploadError("Image file is required")
        if len(content) > settings.max_upload_bytes:
            raise MediaUploadError("Image file is too large")
        uploaded = self.storage.upload_image(content, filename, content_type)
        return MediaUploadResponse.model_validate(uploaded)


def get_media_service() -> MediaService:
    """Return the configured media service."""
    settings = get_settings()
    if (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    ):
        return MediaService(
            CloudinaryMediaStorage(
                cloud_name=settings.cloudinary_cloud_name,
                api_key=settings.cloudinary_api_key,
                api_secret=settings.cloudinary_api_secret,
            )
        )
    if settings.app_env.lower() == "production":
        raise MediaUploadError("Cloudinary credentials are not configured")
    return MediaService(LocalMediaStorage())


def _cloudinary_signature(params: dict[str, Any], api_secret: str) -> str:
    serialized = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return sha1(f"{serialized}{api_secret}".encode("utf-8")).hexdigest()


def _format_from_content_type(content_type: str) -> str | None:
    return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }.get(content_type)
