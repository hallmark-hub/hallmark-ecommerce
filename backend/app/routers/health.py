from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.responses import fail, ok
from app.db.supabase import get_supabase_client, supabase_is_configured

router = APIRouter()
logger = get_logger(__name__)


@router.get("/health")
async def health_check() -> dict[str, object]:
    """Return backend service liveness."""
    return ok({"status": "ok"}, "Service is running")


@router.get("/health/ready", response_model=None)
async def readiness_check() -> JSONResponse | dict[str, object]:
    """Return readiness, including whether Supabase is reachable.

    Separate from /health so the platform's liveness ping does not hit the
    database on every check.
    """
    settings = get_settings()
    if not supabase_is_configured():
        status = "degraded" if settings.is_production else "local"
        return ok(
            {"status": status, "database": "not_configured"},
            "Supabase is not configured",
        )
    try:
        await run_in_threadpool(_probe_database)
    except Exception:
        logger.exception("Readiness probe could not reach Supabase")
        return JSONResponse(
            status_code=503,
            content=fail("Database is unreachable"),
        )
    return ok({"status": "ok", "database": "ok"}, "Service is ready")


def _probe_database() -> None:
    get_supabase_client().table("categories").select("id").limit(1).execute()
