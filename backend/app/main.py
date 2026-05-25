from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.routers import (
    admin_analytics,
    admin_orders,
    admin_products,
    catalog,
    health,
    orders,
    payments,
    quotes,
)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    app = FastAPI(title="ChefWare Enterprise API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(catalog.router, prefix="/api/v1")
    app.include_router(admin_analytics.router, prefix="/api/v1")
    app.include_router(admin_orders.router, prefix="/api/v1")
    app.include_router(admin_products.router, prefix="/api/v1")
    app.include_router(orders.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(quotes.router, prefix="/api/v1")
    return app


app = create_app()
