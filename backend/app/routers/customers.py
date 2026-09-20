from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from starlette.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.rate_limit import rate_limit
from app.core.responses import ok
from app.models.customers import (
    CustomerLoginRequest,
    CustomerProfile,
    CustomerRefreshRequest,
    CustomerRegisterRequest,
)
from app.services.customer_service import (
    CustomerService,
    CustomerServiceError,
    get_customer_service,
)
from app.services.quote_service import QuoteService, get_quote_service

router = APIRouter(tags=["customers"])
bearer = HTTPBearer(auto_error=False)


async def require_customer_profile(
    service: Annotated[CustomerService, Depends(get_customer_service)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> CustomerProfile:
    """Require an authenticated customer bearer token."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    profile = await run_in_threadpool(
        service.get_profile_for_token, credentials.credentials
    )
    if profile is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return profile


@router.post(
    "/auth/register",
    status_code=201,
    dependencies=[Depends(rate_limit(limit=5, window_seconds=300))],
)
async def register_customer(
    request: CustomerRegisterRequest,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict[str, object]:
    """Register a customer account."""
    try:
        auth = await run_in_threadpool(service.register, request)
    except CustomerServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(auth.model_dump(mode="json"), "Customer registered")


@router.post(
    "/auth/login",
    dependencies=[Depends(rate_limit(limit=10, window_seconds=300))],
)
async def login_customer(
    request: CustomerLoginRequest,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict[str, object]:
    """Log a customer in."""
    try:
        auth = await run_in_threadpool(service.login, request)
    except CustomerServiceError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return ok(auth.model_dump(mode="json"), "Customer authenticated")


@router.post(
    "/auth/refresh",
    dependencies=[Depends(rate_limit(limit=30, window_seconds=300))],
)
async def refresh_customer_session(
    request: CustomerRefreshRequest,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict[str, object]:
    """Exchange a refresh token for a new access token."""
    try:
        auth = await run_in_threadpool(service.refresh, request.refresh_token)
    except CustomerServiceError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return ok(auth.model_dump(mode="json"), "Session refreshed")


@router.get("/auth/me")
async def get_current_customer(
    profile: Annotated[CustomerProfile, Depends(require_customer_profile)],
) -> dict[str, object]:
    """Return the current customer profile."""
    return ok(profile.model_dump(mode="json"), "Customer profile retrieved")


@router.get("/customer/orders")
async def list_customer_orders(
    service: Annotated[CustomerService, Depends(get_customer_service)],
    profile: Annotated[CustomerProfile, Depends(require_customer_profile)],
) -> dict[str, object]:
    """Return orders for the authenticated customer."""
    orders = await run_in_threadpool(service.list_orders_for_profile, profile)
    return ok([order.model_dump(mode="json") for order in orders], "Customer orders retrieved")


@router.get("/customer/quotes")
async def list_customer_quotes(
    quote_service: Annotated[QuoteService, Depends(get_quote_service)],
    profile: Annotated[CustomerProfile, Depends(require_customer_profile)],
) -> dict[str, object]:
    """Return quote requests for the authenticated customer."""
    quotes = await run_in_threadpool(quote_service.get_quotes_for_email, profile.email)
    return ok([q.model_dump(mode="json") for q in quotes], "Customer quotes retrieved")
