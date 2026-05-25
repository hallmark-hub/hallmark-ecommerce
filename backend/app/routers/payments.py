from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.responses import ok
from app.models.payments import InitializePaystackRequest
from app.services.paystack_service import (
    PaymentValidationError,
    PaystackService,
    get_paystack_service,
)

router = APIRouter(tags=["payments"])


@router.post("/payments/paystack/initialize")
async def initialize_paystack(
    request: InitializePaystackRequest,
    service: Annotated[PaystackService, Depends(get_paystack_service)],
) -> dict[str, object]:
    """Initialize a Paystack transaction for an existing order."""
    try:
        payment = service.initialize(str(request.order_id))
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "Paystack payment initialized")


@router.get("/payments/paystack/verify/{reference}")
async def verify_paystack(
    reference: str,
    service: Annotated[PaystackService, Depends(get_paystack_service)],
) -> dict[str, object]:
    """Verify a Paystack transaction by reference."""
    try:
        payment = service.verify(reference)
    except PaymentValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "Paystack payment verified")
