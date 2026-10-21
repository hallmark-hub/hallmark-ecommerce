from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.core.responses import ok
from app.models.payments import (
    InitializeMoolreRequest,
    InitializePaystackRequest,
    InitializeSeevcashRequest,
)
from app.services.moolre_service import MoolreService, get_moolre_service
from app.services.paystack_service import (
    PaymentValidationError,
    PaystackService,
    get_paystack_service,
)
from app.services.seevcash_service import (
    SeevcashGatewayError,
    SeevcashService,
    SeevcashSignatureError,
    get_seevcash_service,
)

router = APIRouter(tags=["payments"])


@router.post("/payments/paystack/initialize")
async def initialize_paystack(
    request: InitializePaystackRequest,
    service: Annotated[PaystackService, Depends(get_paystack_service)],
) -> dict[str, object]:
    """Initialize a Paystack transaction for an existing order."""
    try:
        payment = await run_in_threadpool(service.initialize, str(request.order_id))
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
        payment = await run_in_threadpool(service.verify, reference)
    except PaymentValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "Paystack payment verified")


@router.post("/payments/paystack/webhook")
async def paystack_webhook(
    request: Request,
    service: Annotated[PaystackService, Depends(get_paystack_service)],
    x_paystack_signature: Annotated[str | None, Header()] = None,
) -> dict[str, object]:
    """Process a Paystack webhook after validating its signature."""
    raw_body = await request.body()
    payload = await request.json()
    try:
        result = await run_in_threadpool(
            service.handle_webhook,
            raw_body=raw_body,
            signature=x_paystack_signature,
            payload=payload,
        )
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(result, "Paystack webhook processed")


@router.post("/payments/moolre/initialize")
async def initialize_moolre(
    request: InitializeMoolreRequest,
    service: Annotated[MoolreService, Depends(get_moolre_service)],
) -> dict[str, object]:
    """Generate a Moolre hosted payment link for an existing order."""
    try:
        payment = await run_in_threadpool(service.initialize, str(request.order_id))
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "Moolre payment initialized")


@router.get("/payments/moolre/verify/{reference}")
async def verify_moolre(
    reference: str,
    service: Annotated[MoolreService, Depends(get_moolre_service)],
) -> dict[str, object]:
    """Verify a Moolre payment by reference through Moolre's status API."""
    try:
        payment = await run_in_threadpool(service.verify, reference)
    except PaymentValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "Moolre payment verified")


@router.post("/payments/moolre/webhook")
async def moolre_webhook(
    request: Request,
    service: Annotated[MoolreService, Depends(get_moolre_service)],
) -> dict[str, object]:
    """Receive a Moolre callback and confirm the payment via the status API."""
    payload = await request.json()
    result = await run_in_threadpool(service.handle_webhook, payload)
    return ok(result, "Moolre webhook processed")


@router.post("/payments/seevcash/initialize")
async def initialize_seevcash(
    request: InitializeSeevcashRequest,
    service: Annotated[SeevcashService, Depends(get_seevcash_service)],
) -> dict[str, object]:
    """Open a SeevCash hosted checkout for an existing order."""
    try:
        payment = await run_in_threadpool(service.initialize, str(request.order_id))
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "SeevCash payment initialized")


@router.get("/payments/seevcash/verify/{reference}")
async def verify_seevcash(
    reference: str,
    service: Annotated[SeevcashService, Depends(get_seevcash_service)],
) -> dict[str, object]:
    """Verify an order's SeevCash payment by order reference through SeevCash's status API."""
    try:
        payment = await run_in_threadpool(service.verify, reference)
    except PaymentValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(payment.model_dump(mode="json"), "SeevCash payment verified")


@router.post("/payments/seevcash/webhook")
async def seevcash_webhook(
    request: Request,
    service: Annotated[SeevcashService, Depends(get_seevcash_service)],
    x_seev_timestamp: Annotated[str | None, Header()] = None,
    x_seev_signature: Annotated[str | None, Header()] = None,
) -> dict[str, object]:
    """Process a SeevCash webhook after validating its signature."""
    raw_body = await request.body()
    try:
        result = await run_in_threadpool(service.handle_webhook, raw_body, x_seev_timestamp, x_seev_signature)
    except SeevcashSignatureError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except SeevcashGatewayError as exc:
        # Not 2xx: SeevCash does not retry, so a failed delivery is the cue to replay it.
        raise HTTPException(status_code=503, detail="Payment status could not be confirmed") from exc
    return ok(result, "SeevCash webhook processed")
