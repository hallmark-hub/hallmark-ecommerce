from typing import Any


def envelope(success: bool, data: Any, message: str) -> dict[str, Any]:
    """Build the standard API response envelope."""
    return {"success": success, "data": data, "message": message}


def ok(data: Any, message: str) -> dict[str, Any]:
    """Build a successful API response envelope."""
    return envelope(True, data, message)


def fail(message: str, data: Any = None) -> dict[str, Any]:
    """Build a failed API response envelope."""
    return envelope(False, data, message)
