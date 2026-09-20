from asyncio import to_thread
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.models.site_content import SiteContent
from app.services.site_content_service import SiteContentService, get_site_content_service

router = APIRouter(
    prefix="/admin",
    tags=["admin-site-content"],
    dependencies=[Depends(require_admin)],
)


@router.get("/site-content")
async def get_admin_site_content(
    service: Annotated[SiteContentService, Depends(get_site_content_service)],
) -> dict[str, object]:
    """Return current public website content for editing."""
    content = await to_thread(service.get)
    return ok(content.model_dump(mode="json"), "Site content retrieved")


@router.put("/site-content")
async def update_admin_site_content(
    request: SiteContent,
    service: Annotated[SiteContentService, Depends(get_site_content_service)],
) -> dict[str, object]:
    """Replace the public website content with validated admin input."""
    content = await to_thread(service.update, request)
    return ok(content.model_dump(mode="json"), "Site content updated")
