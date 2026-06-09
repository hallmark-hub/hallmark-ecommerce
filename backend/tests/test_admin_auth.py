import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from app.core.admin_auth import require_admin


@pytest.mark.asyncio
async def test_admin_auth_rejects_missing_token() -> None:
    with pytest.raises(HTTPException) as exc:
        await require_admin(authorization=None)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_auth_rejects_non_admin_token() -> None:
    profile = MagicMock()
    profile.role = "customer"
    service = MagicMock()
    service.get_profile_for_token = MagicMock(return_value=profile)
    with patch("app.core.admin_auth.get_customer_service", new=AsyncMock(return_value=service)):
        with pytest.raises(HTTPException) as exc:
            await require_admin(authorization="Bearer sometoken")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_auth_allows_admin_token() -> None:
    profile = MagicMock()
    profile.role = "admin"
    service = MagicMock()
    service.get_profile_for_token = MagicMock(return_value=profile)
    with patch("app.core.admin_auth.get_customer_service", new=AsyncMock(return_value=service)):
        result = await require_admin(authorization="Bearer admintoken")
    assert result is None
