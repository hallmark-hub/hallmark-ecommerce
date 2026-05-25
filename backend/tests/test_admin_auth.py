import pytest
from fastapi import HTTPException

from app.core.admin_auth import require_admin
from app.core.config import get_settings


@pytest.mark.asyncio
async def test_admin_auth_allows_local_without_key(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.delenv("ADMIN_API_KEY", raising=False)
    get_settings.cache_clear()

    assert await require_admin() is None

    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_admin_auth_rejects_invalid_key(monkeypatch) -> None:
    monkeypatch.setenv("ADMIN_API_KEY", "secret")
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        await require_admin(x_admin_api_key="bad")

    assert exc.value.status_code == 403

    get_settings.cache_clear()
