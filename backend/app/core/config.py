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
    supabase_jwt_secret: str = Field(default="", alias="SUPABASE_JWT_SECRET")
    paystack_secret_key: str = Field(default="", alias="PAYSTACK_SECRET_KEY")
    paystack_public_key: str = Field(default="", alias="PAYSTACK_PUBLIC_KEY")
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

    @property
    def is_production(self) -> bool:
        """Return whether the app is running in the production environment."""
        return self.app_env.lower() == "production"

    def missing_production_settings(self) -> list[str]:
        """Return required production settings that are not configured.

        Without this check a missing Supabase variable silently drops the app
        onto the in-memory repositories, where real orders are written to a
        dict that is lost on the next restart.
        """
        required = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_ANON_KEY": self.supabase_anon_key,
            "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
            "PAYSTACK_SECRET_KEY": self.paystack_secret_key,
            "PAYSTACK_PUBLIC_KEY": self.paystack_public_key,
            "CLOUDINARY_CLOUD_NAME": self.cloudinary_cloud_name,
            "CLOUDINARY_API_KEY": self.cloudinary_api_key,
            "CLOUDINARY_API_SECRET": self.cloudinary_api_secret,
            "FRONTEND_URL": self.frontend_url,
        }
        return sorted(name for name, value in required.items() if not value)


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
