from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    """Uploaded media response."""

    secure_url: str
    public_id: str
    bytes: int
    format: str | None = None
