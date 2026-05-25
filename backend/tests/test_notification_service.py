from app.core.config import get_settings
from app.services.notification_service import NotificationService


def test_notification_service_blocks_local_external_messages(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("AT_API_KEY", "key")
    monkeypatch.setenv("AT_USERNAME", "user")
    monkeypatch.setenv("AT_SENDER_ID", "sender")
    monkeypatch.setenv("ADMIN_NOTIFICATION_PHONE", "+233244123456")
    get_settings.cache_clear()

    assert NotificationService().should_send_admin_notifications() is False

    get_settings.cache_clear()
