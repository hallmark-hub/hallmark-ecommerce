from fastapi import APIRouter

from app.core.responses import ok

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, object]:
    """Return backend service health."""
    return ok({"status": "ok"}, "Service is running")
