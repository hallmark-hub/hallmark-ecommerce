import hashlib
import hmac
from typing import Any, Protocol

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.orders import PaymentMethod, PaymentStatus
from app.models.payments import InitializePaystackResponse, VerifyPaystackResponse
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.payment_repository import PaymentRepository, get_payment_repository
from app.services.notification_service import NotificationService, get_notification_service

logger = get_logger(__name__)


class PaymentValidationError(ValueError):
    """Raised when a payment request violates business rules."""


class PaystackGatewayError(RuntimeError):
    """Raised when Paystack API communication fails."""


class PaystackGateway(Protocol):
    """Paystack API boundary."""

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str | None = None,
    ) -> dict[str, str]:
        """Initialize a Paystack payment."""

    def verify(self, reference: str) -> dict[str, object]:
        """Verify a Paystack payment."""


class LocalPaystackGateway:
    """Local Paystack gateway for dev/tests without external calls."""

    _amounts: dict[str, int] = {}

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str | None = None,
    ) -> dict[str, str]:
        """Return deterministic local checkout data."""
        self._amounts[reference] = amount_pesewas
        return {
            "authorization_url": f"https://checkout.paystack.com/local-{reference}",
            "access_code": f"local-{reference}",
            "reference": reference,
        }

    def verify(self, reference: str) -> dict[str, object]:
        """Return deterministic local verification data."""
        return {"reference": reference, "status": "success", "amount": self._amounts[reference], "currency": "GHS"}


class HttpPaystackGateway:
    """HTTP Paystack gateway for configured environments."""

    def __init__(self, secret_key: str) -> None:
        self.secret_key = secret_key

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str | None = None,
    ) -> dict[str, str]:
        """Initialize a Paystack payment through Paystack API."""
        payload = {"email": email, "amount": amount_pesewas, "reference": reference, "currency": "GHS"}
        if callback_url is not None:
            payload["callback_url"] = callback_url
        try:
            response = httpx.post(
                "https://api.paystack.co/transaction/initialize",
                headers={"Authorization": f"Bearer {self.secret_key}"},
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
            payload = response.json()
            data = payload["data"]
            return {
                "authorization_url": data["authorization_url"],
                "access_code": data["access_code"],
                "reference": data["reference"],
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            raise PaystackGatewayError("Paystack initialization failed") from exc

    def verify(self, reference: str) -> dict[str, object]:
        """Verify a Paystack payment through Paystack API."""
        try:
            response = httpx.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {self.secret_key}"},
                timeout=15,
            )
            response.raise_for_status()
            payload = response.json()
            data = payload["data"]
            return {
                "reference": data.get("reference"),
                "status": data.get("status"),
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "raw": payload,
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            raise PaystackGatewayError("Paystack verification failed") from exc


class PaystackService:
    """Paystack payment business logic."""

    def __init__(
        self,
        orders: OrderRepository,
        payments: PaymentRepository,
        gateway: PaystackGateway,
        notifications: NotificationService,
    ) -> None:
        self.orders = orders
        self.payments = payments
        self.gateway = gateway
        self.notifications = notifications

    def initialize(self, order_id: str) -> InitializePaystackResponse:
        """Initialize payment for an existing Paystack order."""
        order = self.orders.get_order_by_id(order_id)
        if order is None:
            raise PaymentValidationError("Order not found")
        if order["payment_method"] != PaymentMethod.paystack:
            raise PaymentValidationError("Order payment method is not Paystack")
        if order["payment_status"] == PaymentStatus.paid:
            raise PaymentValidationError("Order has already been paid")
        existing = self.payments.get_payment_by_reference(order["reference"])
        if existing is not None:
            return InitializePaystackResponse(
                authorization_url=existing["provider_authorization_url"],
                access_code=existing["provider_access_code"],
                reference=existing["reference"],
            )

        try:
            initialized = self.gateway.initialize(
                email=order["customer_email"],
                amount_pesewas=order["total_pesewas"],
                reference=order["reference"],
                callback_url=_paystack_callback_url(),
            )
        except PaystackGatewayError as exc:
            raise PaymentValidationError(str(exc)) from exc
        if initialized.get("reference") != order["reference"]:
            raise PaymentValidationError("Paystack returned an unexpected reference")
        self.payments.create_payment(
            {
                "order_id": order["id"],
                "provider": PaymentMethod.paystack.value,
                "reference": order["reference"],
                "status": PaymentStatus.pending.value,
                "amount_pesewas": order["total_pesewas"],
                "provider_access_code": initialized["access_code"],
                "provider_authorization_url": initialized["authorization_url"],
                "raw_response": initialized,
            }
        )
        return InitializePaystackResponse.model_validate(initialized)

    def verify(self, reference: str) -> VerifyPaystackResponse:
        """Verify Paystack payment status and persist the result."""
        payment = self.payments.get_payment_by_reference(reference)
        if payment is None:
            raise PaymentValidationError("Payment not found")

        try:
            verified = self.gateway.verify(reference)
        except PaystackGatewayError as exc:
            raise PaymentValidationError(str(exc)) from exc
        _validate_provider_payment(reference, payment, verified)
        payment_status = _payment_status(verified.get("status"))
        already_paid = payment["status"] == PaymentStatus.paid.value
        payment_status = _safe_next_status(payment["status"], payment_status)
        self.payments.update_payment_status(
            reference=reference,
            status=payment_status.value,
            raw_response=dict(verified),
        )
        self.orders.update_payment_status(str(payment["order_id"]), payment_status.value)
        if payment_status == PaymentStatus.paid and not self.orders.apply_order_stock(str(payment["order_id"])):
            logger.error(
                "Paid payment could not be matched to available stock for order %s",
                payment["order_id"],
            )
        if not already_paid and payment_status == PaymentStatus.paid:
            order = self.orders.get_order_by_id(str(payment["order_id"]))
            if order is not None:
                self.notifications.send_order_receipt(order)
        return VerifyPaystackResponse(
            reference=reference,
            payment_status=payment_status,
            order_id=payment["order_id"],
        )

    def handle_webhook(
        self,
        raw_body: bytes,
        signature: str | None,
        payload: dict[str, Any],
    ) -> dict[str, bool]:
        """Validate and process a Paystack webhook payload."""
        settings = get_settings()
        if not settings.paystack_secret_key:
            raise PaymentValidationError("Paystack webhook secret is not configured")
        if not _valid_paystack_signature(
            raw_body,
            signature,
            settings.paystack_secret_key,
        ):
            raise PaymentValidationError("Invalid Paystack webhook signature")

        event_type = str(payload.get("event", ""))
        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        reference = str(data.get("reference", ""))
        event_key = _paystack_event_key(event_type, data)
        if self.payments.payment_event_exists(PaymentMethod.paystack.value, event_key):
            return {"received": True}

        payment = self.payments.get_payment_by_reference(reference) if reference else None

        payment_status = _payment_status_from_webhook(event_type, data)
        if payment is not None and payment_status is not None:
            _validate_provider_payment(reference, payment, data)
            already_paid = payment["status"] == PaymentStatus.paid.value
            payment_status = _safe_next_status(payment["status"], payment_status)
            self.payments.update_payment_status(
                reference=reference,
                status=payment_status.value,
                raw_response=payload,
            )
            self.orders.update_payment_status(
                str(payment["order_id"]),
                payment_status.value,
            )
            if payment_status == PaymentStatus.paid:
                # Idempotent at the database level, so a webhook retry that
                # slips past dedup still cannot double-decrement stock.
                if not self.orders.apply_order_stock(str(payment["order_id"])):
                    logger.error(
                        "Paid webhook could not be matched to available stock for order %s",
                        payment["order_id"],
                    )
                if not already_paid:
                    order = self.orders.get_order_by_id(str(payment["order_id"]))
                    if order is not None:
                        self.notifications.send_order_receipt(order)

        self.payments.create_payment_event(
            {
                "payment_id": payment.get("id") if payment is not None else None,
                "order_id": payment.get("order_id") if payment is not None else None,
                "provider": PaymentMethod.paystack.value,
                "event_key": event_key,
                "event_type": event_type,
                "reference": reference or None,
                "payload": payload,
                "signature_valid": True,
            }
        )
        return {"received": True}


def get_paystack_gateway() -> PaystackGateway:
    """Return the configured Paystack gateway."""
    settings = get_settings()
    if settings.paystack_secret_key:
        return HttpPaystackGateway(settings.paystack_secret_key)
    return LocalPaystackGateway()


def _paystack_callback_url() -> str:
    settings = get_settings()
    return f"{settings.frontend_url.rstrip('/')}/payment/verify"


def _valid_paystack_signature(
    raw_body: bytes,
    signature: str | None,
    secret_key: str,
) -> bool:
    if not signature:
        return False
    digest = hmac.new(secret_key.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature)


def _payment_status_from_webhook(
    event_type: str,
    data: dict[str, Any],
) -> PaymentStatus | None:
    if event_type != "charge.success":
        return None
    return _payment_status(data.get("status"))


def _paystack_event_key(event_type: str, data: dict[str, Any]) -> str:
    event_id = data.get("id")
    reference = data.get("reference")
    if event_id is not None:
        return f"{event_type}:{event_id}"
    return f"{event_type}:{reference}"


def _validate_provider_payment(
    reference: str,
    payment: dict[str, Any],
    result: dict[str, Any],
) -> None:
    """Require Paystack to confirm reference, exact amount and currency."""
    if result.get("reference") != reference:
        raise PaymentValidationError("Paystack reference does not match payment")
    amount = result.get("amount")
    if isinstance(amount, bool) or not isinstance(amount, int):
        raise PaymentValidationError("Paystack amount is invalid")
    if amount != payment["amount_pesewas"]:
        raise PaymentValidationError("Paystack amount does not match order total")
    if result.get("currency") != "GHS":
        raise PaymentValidationError("Paystack currency does not match order currency")


def _payment_status(provider_status: object) -> PaymentStatus:
    """Keep non-final Paystack results pending."""
    if provider_status == "success":
        return PaymentStatus.paid
    if provider_status in {"failed", "abandoned"}:
        return PaymentStatus.failed
    return PaymentStatus.pending


def _safe_next_status(
    current_status: str,
    requested_status: PaymentStatus,
) -> PaymentStatus:
    if current_status == PaymentStatus.paid and requested_status != PaymentStatus.paid:
        return PaymentStatus.paid
    return requested_status


async def get_paystack_service() -> PaystackService:
    """Dependency provider for Paystack service."""
    return PaystackService(
        orders=get_order_repository(),
        payments=get_payment_repository(),
        gateway=get_paystack_gateway(),
        notifications=await get_notification_service(),
    )
