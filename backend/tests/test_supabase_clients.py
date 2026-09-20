from types import SimpleNamespace

from app.db import supabase


def test_data_clients_are_isolated_while_auth_client_is_dedicated(monkeypatch) -> None:
    """Concurrent data repositories must not share one sync HTTP session."""
    created: list[tuple[str, str]] = []

    def fake_create_client(url: str, key: str) -> object:
        created.append((url, key))
        return object()

    settings = SimpleNamespace(
        supabase_url="https://example.supabase.co",
        supabase_anon_key="anon-key",
        supabase_service_role_key="service-key",
    )
    monkeypatch.setattr(supabase, "get_settings", lambda: settings)
    monkeypatch.setattr(supabase, "create_client", fake_create_client)
    supabase.get_supabase_auth_client.cache_clear()

    first_data_client = supabase.get_supabase_client()
    second_data_client = supabase.get_supabase_client()
    first_auth_client = supabase.get_supabase_auth_client()
    second_auth_client = supabase.get_supabase_auth_client()

    assert first_data_client is not second_data_client
    assert first_auth_client is second_auth_client
    assert created == [
        (settings.supabase_url, settings.supabase_service_role_key),
        (settings.supabase_url, settings.supabase_service_role_key),
        (settings.supabase_url, settings.supabase_anon_key),
    ]

    supabase.get_supabase_auth_client.cache_clear()
