from app.core.config import get_settings


class NotificationService:
    """Environment-gated admin notification service."""

    def should_send_admin_notifications(self) -> bool:
        """Return whether real admin notifications are allowed."""
        settings = get_settings()
        if settings.app_env.lower() in {"local", "test", "development"}:
            return False
        return bool(
            settings.at_api_key
            and settings.at_username
            and settings.at_sender_id
            and settings.admin_notification_phone
        )

    def notify_quote_request(self, reference: str) -> bool:
        """Notify admin of a quote request when external messaging is allowed."""
        if not self.should_send_admin_notifications():
            return False
        # Real Africa's Talking integration belongs in a later integration slice.
        return False


async def get_notification_service() -> NotificationService:
    """Dependency provider for notification service."""
    return NotificationService()
