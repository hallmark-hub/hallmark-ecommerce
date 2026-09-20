from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


class NotificationService:
    """Notification service — stub until a messaging provider is configured.

    Every skipped notification is logged with its reference so pending customer
    receipts and admin alerts are visible in the Render logs while the WhatsApp
    (WAHA) provider is still outstanding.
    """

    def should_send_admin_notifications(self) -> bool:
        return False

    def notify_quote_request(self, reference: str) -> bool:
        logger.warning(
            "Notification provider not configured — admin alert for quote %s not sent",
            reference,
        )
        return False

    def send_order_receipt(self, order: dict[str, Any]) -> bool:
        logger.warning(
            "Notification provider not configured — receipt for order %s not sent to %s",
            order.get("reference"),
            order.get("customer_phone"),
        )
        return False


async def get_notification_service() -> NotificationService:
    """Dependency provider for notification service."""
    return NotificationService()
