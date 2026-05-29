from functools import lru_cache

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_env: str = Field(default="local", alias="APP_ENV")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    backend_url: AnyUrl = Field(default="http://localhost:8000", alias="BACKEND_URL")
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    at_api_key: str = Field(default="", alias="AT_API_KEY")
    at_username: str = Field(default="", alias="AT_USERNAME")
    at_sender_id: str = Field(default="", alias="AT_SENDER_ID")
    admin_notification_phone: str = Field(default="", alias="ADMIN_NOTIFICATION_PHONE")
    paystack_secret_key: str = Field(default="", alias="PAYSTACK_SECRET_KEY")
    paystack_public_key: str = Field(default="", alias="PAYSTACK_PUBLIC_KEY")
    admin_api_key: str = Field(default="", alias="ADMIN_API_KEY")
    cors_allowed_origins: str = Field(default="", alias="CORS_ALLOWED_ORIGINS")
    cloudinary_cloud_name: str = Field(default="", alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="", alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="", alias="CLOUDINARY_API_SECRET")
    max_upload_bytes: int = Field(default=5_000_000, alias="MAX_UPLOAD_BYTES")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        """Return the configured CORS allowlist, falling back to the frontend URL."""
        raw = [origin.strip() for origin in self.cors_allowed_origins.split(",")]
        origins = [origin for origin in raw if origin]
        return origins or [self.frontend_url]


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
