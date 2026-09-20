import logging
import sys

from app.core.config import get_settings


def configure_logging() -> None:
    """Configure application logging to stdout so Render captures it."""
    settings = get_settings()
    logging.basicConfig(
        level=logging.INFO if settings.is_production else logging.DEBUG,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )
    # HTTP/2 debug logs can contain Authorization and API-key headers.
    for logger_name in ("httpx", "httpcore", "hpack"):
        logging.getLogger(logger_name).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named application logger."""
    return logging.getLogger(name)
