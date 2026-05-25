from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.responses import ok
from app.models.quotes import CreateQuoteRequest
from app.services.quote_service import QuoteService, QuoteValidationError, get_quote_service

router = APIRouter(tags=["quotes"])


@router.post("/quote-requests", status_code=201)
async def create_quote_request(
    request: CreateQuoteRequest,
    service: Annotated[QuoteService, Depends(get_quote_service)],
) -> dict[str, object]:
    """Create a quote request for quote-only categories."""
    try:
        quote_request = service.create_quote_request(request)
    except QuoteValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(quote_request.model_dump(mode="json"), "Quote request received")
