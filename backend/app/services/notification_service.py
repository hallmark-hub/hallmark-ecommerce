from typing import Any


class NotificationService:
    """Notification service — stub until a messaging provider is configured."""

    def should_send_admin_notifications(self) -> bool:
        return False

    def notify_quote_request(self, reference: str) -> bool:
        return False

    def send_order_receipt(self, order: dict[str, Any]) -> bool:
        return False


async def get_notification_service() -> NotificationService:
    """Dependency provider for notification service."""
    return NotificationService()
