from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.responses import fail


def _message_from_detail(detail: object) -> str:
    if isinstance(detail, str):
        return detail
    return "Request could not be processed"


def register_exception_handlers(app: FastAPI) -> None:
    """Register API-wide exception handlers."""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Return framework validation errors in the standard envelope."""
        return JSONResponse(
            status_code=422,
            content=fail("Validation failed", {"errors": jsonable_encoder(exc.errors())}),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Return HTTP exceptions in the standard envelope."""
        return JSONResponse(
            status_code=exc.status_code,
            content=fail(_message_from_detail(exc.detail)),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Return unhandled errors in the standard envelope."""
        return JSONResponse(
            status_code=500,
            content=fail("Internal server error"),
        )
