from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.services.admin_analytics_service import (
    AdminAnalyticsService,
    get_admin_analytics_service,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin-analytics"],
    dependencies=[Depends(require_admin)],
)


@router.get("/analytics/summary")
async def get_admin_analytics_summary(
    service: Annotated[AdminAnalyticsService, Depends(get_admin_analytics_service)],
) -> dict[str, object]:
    """Return basic admin analytics summary."""
    summary = service.get_summary()
    return ok(summary.model_dump(mode="json"), "Analytics summary retrieved")
