from app.services.notification_service import NotificationService


def test_notification_service_is_no_op() -> None:
    service = NotificationService()
    assert service.should_send_admin_notifications() is False
    assert service.notify_quote_request("QR-20240101-0001") is False
    assert service.send_order_receipt({"reference": "ORD-001", "customer_email": "x@x.com"}) is False
