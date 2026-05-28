from typing import Annotated

from fastapi import Header, HTTPException

from app.core.config import get_settings
from app.services.customer_service import get_customer_service


async def require_admin(
    authorization: Annotated[str | None, Header()] = None,
    x_admin_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Require an admin bearer token or configured admin API key."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        profile = get_customer_service().get_profile_for_token(token)
        if profile is not None and profile.role == "admin":
            return

    settings = get_settings()
    if not settings.admin_api_key:
        if settings.app_env.lower() == "production":
            raise HTTPException(status_code=403, detail="Admin API key is not configured")
        return
    if x_admin_api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
