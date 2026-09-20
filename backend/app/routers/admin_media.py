from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.admin_auth import require_admin
from app.core.responses import ok
from app.services.media_service import MediaService, MediaUploadError, get_media_service

router = APIRouter(
    prefix="/admin",
    tags=["admin-media"],
    dependencies=[Depends(require_admin)],
)


@router.post("/media/images", status_code=201)
async def upload_admin_image(
    file: Annotated[UploadFile, File()],
    service: Annotated[MediaService, Depends(get_media_service)],
) -> dict[str, object]:
    """Upload an admin-selected image to configured media storage."""
    try:
        content = file.file.read()
        uploaded = await run_in_threadpool(
            service.upload_product_image,
            content=content,
            filename=file.filename or "product-image",
            content_type=file.content_type or "",
        )
    except MediaUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(uploaded.model_dump(mode="json"), "Image uploaded")
