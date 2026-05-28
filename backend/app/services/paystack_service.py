import hashlib
import hmac
from typing import Any, Protocol

import httpx

from app.core.config import get_settings
from app.models.orders import PaymentMethod, PaymentStatus
from app.models.payments import InitializePaystackResponse, VerifyPaystackResponse
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.payment_repository import PaymentRepository, get_payment_repository


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

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str | None = None,
    ) -> dict[str, str]:
        """Return deterministic local checkout data."""
        return {
            "authorization_url": f"https://checkout.paystack.com/local-{reference}",
            "access_code": f"local-{reference}",
            "reference": reference,
        }

    def verify(self, reference: str) -> dict[str, object]:
        """Return deterministic local verification data."""
        return {"reference": reference, "status": "success", "amount": None}


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
        payload = {"email": email, "amount": amount_pesewas, "reference": reference}
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
                "reference": reference,
                "status": data.get("status"),
                "amount": data.get("amount"),
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
    ) -> None:
        self.orders = orders
        self.payments = payments
        self.gateway = gateway

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
        self.payments.create_payment(
            {
                "order_id": order["id"],
                "provider": PaymentMethod.paystack.value,
                "reference": initialized["reference"],
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
        _validate_payment_amount(payment, verified.get("amount"))
        payment_status = (
            PaymentStatus.paid
            if verified.get("status") == "success"
            else PaymentStatus.failed
        )
        payment_status = _safe_next_status(payment["status"], payment_status)
        self.payments.update_payment_status(
            reference=reference,
            status=payment_status.value,
            raw_response=dict(verified),
        )
        self.orders.update_payment_status(str(payment["order_id"]), payment_status.value)
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
            _validate_payment_amount(payment, data.get("amount"))
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
    return PaymentStatus.paid if data.get("status") == "success" else PaymentStatus.failed


def _paystack_event_key(event_type: str, data: dict[str, Any]) -> str:
    event_id = data.get("id")
    reference = data.get("reference")
    if event_id is not None:
        return f"{event_type}:{event_id}"
    return f"{event_type}:{reference}"


def _validate_payment_amount(payment: dict[str, Any], amount: object) -> None:
    if amount is None:
        return
    if not isinstance(amount, int):
        raise PaymentValidationError("Paystack amount is invalid")
    if amount != payment["amount_pesewas"]:
        raise PaymentValidationError("Paystack amount does not match order total")


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
    )
