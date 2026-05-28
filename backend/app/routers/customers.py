from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.responses import ok
from app.models.customers import CustomerLoginRequest, CustomerProfile, CustomerRegisterRequest
from app.services.customer_service import (
    CustomerService,
    CustomerServiceError,
    get_customer_service,
)

router = APIRouter(tags=["customers"])
bearer = HTTPBearer(auto_error=False)


async def require_customer_profile(
    service: Annotated[CustomerService, Depends(get_customer_service)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> CustomerProfile:
    """Require an authenticated customer bearer token."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    profile = service.get_profile_for_token(credentials.credentials)
    if profile is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return profile


@router.post("/auth/register", status_code=201)
async def register_customer(
    request: CustomerRegisterRequest,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict[str, object]:
    """Register a customer account."""
    try:
        auth = service.register(request)
    except CustomerServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(auth.model_dump(mode="json"), "Customer registered")


@router.post("/auth/login")
async def login_customer(
    request: CustomerLoginRequest,
    service: Annotated[CustomerService, Depends(get_customer_service)],
) -> dict[str, object]:
    """Log a customer in."""
    try:
        auth = service.login(request)
    except CustomerServiceError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return ok(auth.model_dump(mode="json"), "Customer authenticated")


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
    orders = service.list_orders_for_profile(profile)
    return ok([order.model_dump(mode="json") for order in orders], "Customer orders retrieved")
