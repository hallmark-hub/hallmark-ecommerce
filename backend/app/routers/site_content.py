from asyncio import to_thread
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.responses import ok
from app.services.site_content_service import SiteContentService, get_site_content_service

router = APIRouter(tags=["site-content"])


@router.get("/site-content")
async def get_site_content(
    service: Annotated[SiteContentService, Depends(get_site_content_service)],
) -> dict[str, object]:
    """Return admin-managed content for the public storefront."""
    content = await to_thread(service.get)
    return ok(content.model_dump(mode="json"), "Site content retrieved")
