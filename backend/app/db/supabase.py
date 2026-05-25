from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from app.core.config import get_settings


def supabase_is_configured() -> bool:
    """Return whether Supabase credentials are configured."""
    settings = get_settings()
    return bool(settings.supabase_url and settings.supabase_anon_key)


@lru_cache
def get_supabase_client() -> Client:
    """Return a cached Supabase client."""
    settings = get_settings()
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    if not settings.supabase_url or not key:
        raise RuntimeError("Supabase credentials are not configured")
    return create_client(settings.supabase_url, key)


def response_data(response: Any) -> list[dict[str, Any]]:
    """Extract data from a Supabase response."""
    data = getattr(response, "data", None)
    return data if isinstance(data, list) else []
