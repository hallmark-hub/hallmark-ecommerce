from typing import Annotated

from fastapi import Header, HTTPException

from app.services.customer_service import get_customer_service


async def require_admin(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Require a bearer token belonging to a Supabase user with role='admin'."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        profile = (await get_customer_service()).get_profile_for_token(token)
        if profile is not None and profile.role == "admin":
            return
    raise HTTPException(status_code=403, detail="Admin access required")
