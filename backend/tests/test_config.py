import logging

from app.core.config import Settings
from app.core.logging import configure_logging


def _settings(**overrides: str) -> Settings:
    values: dict[str, str] = {
        "APP_ENV": "production",
        "FRONTEND_URL": "https://chefware.vercel.app",
        "SUPABASE_URL": "https://project.supabase.co",
        "SUPABASE_ANON_KEY": "anon",
        "SUPABASE_SERVICE_ROLE_KEY": "service",
        "PAYSTACK_SECRET_KEY": "sk_live",
        "PAYSTACK_PUBLIC_KEY": "pk_live",
        "CLOUDINARY_CLOUD_NAME": "chefware",
        "CLOUDINARY_API_KEY": "key",
        "CLOUDINARY_API_SECRET": "secret",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[arg-type]


def test_fully_configured_production_reports_nothing_missing() -> None:
    assert _settings().missing_production_settings() == []


def test_missing_supabase_credentials_are_reported() -> None:
    settings = _settings(SUPABASE_SERVICE_ROLE_KEY="", SUPABASE_URL="")

    assert settings.missing_production_settings() == [
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_URL",
    ]


def test_is_production_is_case_insensitive() -> None:
    assert _settings(APP_ENV="Production").is_production is True
    assert _settings(APP_ENV="local").is_production is False


def test_cors_origins_fall_back_to_the_frontend_url() -> None:
    assert _settings(CORS_ALLOWED_ORIGINS="").cors_origins == [
        "https://chefware.vercel.app"
    ]
    assert _settings(CORS_ALLOWED_ORIGINS="https://a.com, https://b.com").cors_origins == [
        "https://a.com",
        "https://b.com",
    ]


def test_transport_debug_logs_are_suppressed() -> None:
    configure_logging()

    assert logging.getLogger("httpx").level == logging.WARNING
    assert logging.getLogger("httpcore").level == logging.WARNING
    assert logging.getLogger("hpack").level == logging.WARNING
