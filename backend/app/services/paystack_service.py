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


class PaystackGateway(Protocol):
    """Paystack API boundary."""

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
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
    ) -> dict[str, str]:
        """Return deterministic local checkout data."""
        return {
            "authorization_url": f"https://checkout.paystack.com/local-{reference}",
            "access_code": f"local-{reference}",
            "reference": reference,
        }

    def verify(self, reference: str) -> dict[str, object]:
        """Return deterministic local verification data."""
        return {"reference": reference, "status": "success"}


class HttpPaystackGateway:
    """HTTP Paystack gateway for configured environments."""

    def __init__(self, secret_key: str) -> None:
        self.secret_key = secret_key

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
    ) -> dict[str, str]:
        """Initialize a Paystack payment through Paystack API."""
        response = httpx.post(
            "https://api.paystack.co/transaction/initialize",
            headers={"Authorization": f"Bearer {self.secret_key}"},
            json={"email": email, "amount": amount_pesewas, "reference": reference},
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

    def verify(self, reference: str) -> dict[str, object]:
        """Verify a Paystack payment through Paystack API."""
        response = httpx.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {self.secret_key}"},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        data = payload["data"]
        return {"reference": reference, "status": data.get("status"), "raw": payload}


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

        initialized = self.gateway.initialize(
            email=order["customer_email"],
            amount_pesewas=order["total_pesewas"],
            reference=order["reference"],
        )
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

        verified = self.gateway.verify(reference)
        payment_status = (
            PaymentStatus.paid
            if verified.get("status") == "success"
            else PaymentStatus.failed
        )
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
        payment = self.payments.get_payment_by_reference(reference) if reference else None

        payment_status = _payment_status_from_webhook(event_type, data)
        if payment is not None and payment_status is not None:
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


async def get_paystack_service() -> PaystackService:
    """Dependency provider for Paystack service."""
    return PaystackService(
        orders=get_order_repository(),
        payments=get_payment_repository(),
        gateway=get_paystack_gateway(),
    )
