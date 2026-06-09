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


@lru_cache
def get_supabase_auth_client() -> Client:
    """Return a cached client dedicated to auth operations.

    Auth calls (sign_in/sign_up/get_user) set the session on whichever client
    makes them. Running them on a separate anon client keeps them from
    overwriting the service-role session on the shared data client — otherwise
    every query after a login would run as the end user's RLS-restricted role.
    """
    settings = get_settings()
    key = settings.supabase_anon_key or settings.supabase_service_role_key
    if not settings.supabase_url or not key:
        raise RuntimeError("Supabase credentials are not configured")
    return create_client(settings.supabase_url, key)


def response_data(response: Any) -> list[dict[str, Any]]:
    """Extract data from a Supabase response."""
    data = getattr(response, "data", None)
    return data if isinstance(data, list) else []
