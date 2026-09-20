import time
from collections import deque
from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import HTTPException, Request

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Guards against unbounded growth from spoofed or rotating client addresses.
_MAX_TRACKED_CLIENTS = 10_000


class SlidingWindowRateLimiter:
    """Per-client sliding window counter held in process memory.

    State lives in the worker process, so it resets on restart and is not
    shared across workers. That is sufficient for the current single-worker
    Render deployment; a multi-worker setup needs a shared store instead.
    """

    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}

    def allow(self, key: str) -> bool:
        """Record a hit for the key and return whether it stays within limit."""
        now = time.monotonic()
        cutoff = now - self.window_seconds
        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if not hits and len(self._hits) > _MAX_TRACKED_CLIENTS:
            self._prune(cutoff)
        if len(hits) >= self.limit:
            return False
        hits.append(now)
        return True

    def _prune(self, cutoff: float) -> None:
        for key in [k for k, v in self._hits.items() if not v or v[-1] <= cutoff]:
            del self._hits[key]


def client_key(request: Request) -> str:
    """Return the client identifier used for rate limiting.

    Render terminates TLS at its proxy, so the caller's address arrives in
    X-Forwarded-For. It is client-supplied and therefore spoofable — this is a
    throttle on casual abuse, not an access control.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(
    limit: int,
    window_seconds: int,
) -> Callable[[Request], Coroutine[Any, Any, None]]:
    """Build a dependency that rejects a client over `limit` per window."""
    limiter = SlidingWindowRateLimiter(limit, window_seconds)

    async def dependency(request: Request) -> None:
        # The suite drives many requests from one address; the limiter itself
        # is covered directly in test_rate_limit.py.
        if get_settings().app_env.lower() == "test":
            return
        key = client_key(request)
        if not limiter.allow(key):
            logger.warning(
                "Rate limit hit by %s on %s", key, request.url.path
            )
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again shortly.",
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency
