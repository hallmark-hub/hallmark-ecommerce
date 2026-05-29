from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.models.quotes import UpdateQuoteStatusRequest
from app.services.quote_service import QuoteService, get_quote_service

router = APIRouter(
    prefix="/admin",
    tags=["admin-quotes"],
    dependencies=[Depends(require_admin)],
)


@router.get("/quote-requests")
async def list_admin_quote_requests(
    service: Annotated[QuoteService, Depends(get_quote_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> dict[str, object]:
    """Return recent quote requests for admin management."""
    quotes = service.list_quote_requests(limit)
    return ok([quote.model_dump(mode="json") for quote in quotes], "Quote requests retrieved")


@router.get("/quote-requests/{reference}")
async def get_admin_quote_request(
    reference: str,
    service: Annotated[QuoteService, Depends(get_quote_service)],
) -> dict[str, object]:
    """Return one quote request for admin management."""
    quote = service.get_quote_request(reference)
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote request not found")
    return ok(quote.model_dump(mode="json"), "Quote request retrieved")


@router.patch("/quote-requests/{reference}/status")
async def update_admin_quote_status(
    reference: str,
    request: UpdateQuoteStatusRequest,
    service: Annotated[QuoteService, Depends(get_quote_service)],
) -> dict[str, object]:
    """Update a quote request status for admin management."""
    quote = service.update_quote_status(reference, request.status)
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote request not found")
    return ok(quote.model_dump(mode="json"), "Quote request status updated")
