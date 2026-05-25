from typing import Annotated

from fastapi import Header, HTTPException

from app.core.config import get_settings


async def require_admin(
    x_admin_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Require admin API key when configured."""
    settings = get_settings()
    if not settings.admin_api_key:
        if settings.app_env.lower() == "production":
            raise HTTPException(status_code=403, detail="Admin API key is not configured")
        return
    if x_admin_api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
