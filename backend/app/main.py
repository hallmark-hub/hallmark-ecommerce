from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.routers import (
    admin_analytics,
    admin_media,
    admin_orders,
    admin_products,
    admin_quotes,
    admin_site_content,
    catalog,
    customers,
    health,
    orders,
    payments,
    quotes,
    site_content,
)


logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    configure_logging()
    settings = get_settings()
    missing = settings.missing_production_settings()
    if settings.is_production and missing:
        raise RuntimeError(
            "Refusing to start in production without: " + ", ".join(missing)
        )
    if missing:
        logger.warning(
            "Running with unconfigured settings (in-memory fallbacks active): %s",
            ", ".join(missing),
        )
    app = FastAPI(title="ChefWare Enterprise API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(catalog.router, prefix="/api/v1")
    app.include_router(customers.router, prefix="/api/v1")
    app.include_router(admin_analytics.router, prefix="/api/v1")
    app.include_router(admin_media.router, prefix="/api/v1")
    app.include_router(admin_orders.router, prefix="/api/v1")
    app.include_router(admin_products.router, prefix="/api/v1")
    app.include_router(admin_quotes.router, prefix="/api/v1")
    app.include_router(admin_site_content.router, prefix="/api/v1")
    app.include_router(orders.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(quotes.router, prefix="/api/v1")
    app.include_router(site_content.router, prefix="/api/v1")
    return app


app = create_app()
