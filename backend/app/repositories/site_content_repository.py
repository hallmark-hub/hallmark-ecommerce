from copy import deepcopy
from typing import Any, Protocol

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured


class SiteContentRepository(Protocol):
    """Public website content persistence contract."""

    def get(self) -> dict[str, Any] | None:
        """Return the current public website content."""

    def update(self, content: dict[str, Any]) -> dict[str, Any]:
        """Persist and return public website content."""


class InMemorySiteContentRepository:
    """Local/test content store used when Supabase is not configured."""

    _content: dict[str, Any] | None = None

    def get(self) -> dict[str, Any] | None:
        """Return locally stored content."""
        return deepcopy(self._content)

    def update(self, content: dict[str, Any]) -> dict[str, Any]:
        """Replace locally stored content."""
        self.__class__._content = deepcopy(content)
        return deepcopy(content)


class SupabaseSiteContentRepository:
    """Site content repository backed by the site_content table."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def get(self) -> dict[str, Any] | None:
        """Return the public-site singleton row."""
        response = (
            self.client.table("site_content")
            .select("content")
            .eq("id", "public-site")
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return rows[0].get("content") if rows else None

    def update(self, content: dict[str, Any]) -> dict[str, Any]:
        """Upsert the public-site singleton row."""
        response = (
            self.client.table("site_content")
            .upsert({"id": "public-site", "content": content})
            .execute()
        )
        rows = response_data(response)
        return rows[0].get("content", content) if rows else content


def get_site_content_repository() -> SiteContentRepository:
    """Return persistent storage in production and local memory in tests/dev."""
    if not supabase_is_configured():
        return InMemorySiteContentRepository()
    return SupabaseSiteContentRepository(get_supabase_client())
