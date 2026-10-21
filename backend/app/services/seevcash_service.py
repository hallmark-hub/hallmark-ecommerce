import hashlib
import hmac
import json
import time
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any, Protocol
from urllib.parse import quote
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.orders import PaymentMethod, PaymentStatus
from app.models.payments import InitializeSeevcashResponse, VerifySeevcashResponse
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.payment_repository import PaymentRepository, get_payment_repository
from app.services.notification_service import NotificationService, get_notification_service
from app.services.paystack_service import PaymentValidationError, _safe_next_status

logger = get_logger(__name__)

WEBHOOK_TOLERANCE_SECONDS = 300
# A hosted session lasts about 30 minutes; one about to lapse is replaced, not reused.
EXPIRY_MARGIN = timedelta(minutes=2)
UNAVAILABLE_MESSAGE = "We could not reach the payment provider. Please try again shortly."
_WEBHOOK_EVENTS = {"payment.succeeded", "payment.failed"}


class SeevcashGatewayError(RuntimeError):
    """Raised when SeevCash API communication fails."""


class SeevcashSignatureError(ValueError):
    """Raised when a SeevCash webhook signature cannot be verified."""


class SeevcashGateway(Protocol):
    """SeevCash API boundary."""

    def create_session(
        self,
        *,
        name: str,
        email: str,
        amount_pesewas: int,
        order_reference: str,
        redirect_url: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        """Create a hosted checkout session: reference, checkout_url and the session data."""

    def get_session(self, reference: str) -> dict[str, Any]:
        """Fetch a session: reference, status (pending, success or failed) and the session data."""


class LocalSeevcashGateway:
    """Local SeevCash gateway for dev/tests without external calls; sessions read as paid."""

    _sessions: dict[str, dict[str, Any]] = {}

    def create_session(
        self,
        *,
        name: str,
        email: str,
        amount_pesewas: int,
        order_reference: str,
        redirect_url: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        """Return deterministic local checkout data."""
        reference = f"PAY-LOCAL-{uuid4()}"
        data = {
            "reference": reference,
            "amount": amount_pesewas,
            "currency": "GHS",
            "status": "completed",
            "expires_at": (datetime.now(UTC) + timedelta(minutes=30)).isoformat(),
        }
        self._sessions[reference] = data
        return {
            "reference": reference,
            "checkout_url": f"https://pay.seevplus.com/{reference}",
            "data": data,
        }

    def get_session(self, reference: str) -> dict[str, Any]:
        """Return deterministic local verification data."""
        data = self._sessions[reference]
        return {"reference": reference, "status": _normalize_status(data["status"]), "data": data}


class HttpSeevcashGateway:
    """HTTP SeevCash gateway for configured environments."""

    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def create_session(
        self,
        *,
        name: str,
        email: str,
        amount_pesewas: int,
        order_reference: str,
        redirect_url: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        """Create a hosted mobile money checkout session through the SeevCash API."""
        payload = {
            "type": "checkout",
            "amount": amount_pesewas,
            "currency": "GHS",
            "recipient": {"name": name, "email": email},
            "channels": ["mobile_money"],
            "redirect_url": redirect_url,
            "meta": {"order_reference": order_reference},
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Idempotency-Key": idempotency_key}
        try:
            response = httpx.post(
                f"{self.base_url}/developer/payments", headers=headers, json=payload, timeout=15
            )
            response.raise_for_status()
            if response.status_code == 202:
                raise SeevcashGatewayError("An identical SeevCash request is still in flight")
            data = response.json()["data"]
            return {"reference": data["reference"], "checkout_url": data["checkout_url"], "data": data}
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            logger.error("SeevCash session creation failed for %s: %s", order_reference, _failure_detail(exc))
            raise SeevcashGatewayError("SeevCash session creation failed") from exc

    def get_session(self, reference: str) -> dict[str, Any]:
        """Fetch a session's current status; this route needs no API key."""
        try:
            response = httpx.get(
                f"{self.base_url}/developer/payments/{quote(reference, safe='')}", timeout=15
            )
            response.raise_for_status()
            data = response.json()["data"]
            if not isinstance(data, dict):
                raise ValueError("SeevCash session data is not an object")
            return {
                "reference": data.get("reference"),
                "status": _normalize_status(data.get("status")),
                "data": data,
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            logger.error("SeevCash status check failed for %s: %s", reference, _failure_detail(exc))
            raise SeevcashGatewayError("SeevCash status check failed") from exc


class SeevcashService:
    """SeevCash payment business logic."""

    def __init__(
        self,
        orders: OrderRepository,
        payments: PaymentRepository,
        gateway: SeevcashGateway,
        notifications: NotificationService,
    ) -> None:
        self.orders = orders
        self.payments = payments
        self.gateway = gateway
        self.notifications = notifications

    def initialize(self, order_id: str) -> InitializeSeevcashResponse:
        """Open a hosted checkout for an order, reusing a live session if there is one."""
        order = self.orders.get_order_by_id(order_id)
        if order is None:
            raise PaymentValidationError("Order not found")
        if order["payment_method"] != PaymentMethod.seevcash:
            raise PaymentValidationError("Order payment method is not SeevCash")
        if order["payment_status"] == PaymentStatus.paid:
            raise PaymentValidationError("Order has already been paid")

        # Settle earlier sessions first: one may have been paid after the customer left.
        try:
            if self._refresh(order) == PaymentStatus.paid:
                raise PaymentValidationError("Order has already been paid")
        except SeevcashGatewayError as exc:
            raise PaymentValidationError(UNAVAILABLE_MESSAGE) from exc

        payments = self.payments.get_payments_by_order_id(str(order["id"]))
        live = next((p for p in payments if p["status"] == PaymentStatus.pending and not _is_expired(p)), None)
        if live is not None:
            return InitializeSeevcashResponse(
                authorization_url=live["provider_authorization_url"], reference=order["reference"]
            )

        frontend = get_settings().frontend_url.rstrip("/")
        try:
            session = self.gateway.create_session(
                name=order["customer_name"],
                email=order["customer_email"],
                amount_pesewas=order["total_pesewas"],
                order_reference=order["reference"],
                # SeevCash does not document which parameter it appends, so carry ours under its own name.
                redirect_url=f"{frontend}/payment/verify?order={order['reference']}",
                # Stable for one logical attempt, so a retry replays the session instead of opening a second.
                idempotency_key=f"charge_{order['reference']}_{len(payments)}",
            )
        except SeevcashGatewayError as exc:
            raise PaymentValidationError(UNAVAILABLE_MESSAGE) from exc
        self.payments.create_payment(
            {
                "order_id": order["id"],
                "provider": PaymentMethod.seevcash.value,
                "reference": session["reference"],
                "status": PaymentStatus.pending.value,
                "amount_pesewas": order["total_pesewas"],
                "provider_authorization_url": session["checkout_url"],
                "raw_response": session["data"],
            }
        )
        if order["payment_status"] == PaymentStatus.failed:
            self.orders.update_payment_status(str(order["id"]), PaymentStatus.pending.value)
        return InitializeSeevcashResponse(authorization_url=session["checkout_url"], reference=order["reference"])

    def verify(self, reference: str) -> VerifySeevcashResponse:
        """Verify an order's payment server-side and persist the result."""
        found = self.orders.get_order_by_reference(reference)
        if found is None or found["payment_method"] != PaymentMethod.seevcash:
            raise PaymentValidationError("Payment not found")
        order = self.orders.get_order_by_id(str(found["id"]))
        if order is None or not self.payments.get_payments_by_order_id(str(order["id"])):
            raise PaymentValidationError("Payment not found")
        try:
            status = self._refresh(order)
        except SeevcashGatewayError as exc:
            raise PaymentValidationError(UNAVAILABLE_MESSAGE) from exc
        return VerifySeevcashResponse(reference=reference, payment_status=status, order_id=order["id"])

    def handle_webhook(self, raw_body: bytes, timestamp: str | None, signature: str | None) -> dict[str, bool]:
        """Check a SeevCash webhook's signature, then confirm the payment through the status API.

        The signed payload only identifies the session; payment state is always re-read from the API.
        """
        if not verify_webhook_signature(get_settings().seevcash_webhook_secret, timestamp, signature, raw_body):
            raise SeevcashSignatureError("Invalid webhook signature")
        try:
            payload = json.loads(raw_body)
            transaction = payload["data"]["transaction"]
            reference = str(transaction["reference"])
        except (ValueError, KeyError, TypeError) as exc:
            raise PaymentValidationError("Invalid webhook payload") from exc
        if payload.get("event") not in _WEBHOOK_EVENTS:
            return {"received": True}

        event_key = f"{reference}:{transaction.get('status')}"
        if self.payments.payment_event_exists(PaymentMethod.seevcash.value, event_key):
            return {"received": True}
        payment = self.payments.get_payment_by_reference(reference)
        order = self.orders.get_order_by_id(str(payment["order_id"])) if payment is not None else None
        if order is not None:
            # A gateway failure propagates so the delivery shows as failed and can be replayed.
            self._refresh(order)
        self.payments.create_payment_event(
            {
                "payment_id": payment.get("id") if payment is not None else None,
                "order_id": payment.get("order_id") if payment is not None else None,
                "provider": PaymentMethod.seevcash.value,
                "event_key": event_key,
                "event_type": str(payload["event"]),
                "reference": reference,
                "payload": payload,
                "signature_valid": True,
            }
        )
        return {"received": True}

    def _refresh(self, order: dict[str, Any]) -> PaymentStatus:
        """Re-check the order's unsettled sessions and bring the order's payment status in line."""
        previous = order["payment_status"]  # read first: in-memory orders are updated in place
        payments = self.payments.get_payments_by_order_id(str(order["id"]))
        statuses = [self._settle(payment) for payment in payments]
        if PaymentStatus.paid in statuses:
            status = PaymentStatus.paid
        elif PaymentStatus.pending in statuses or not statuses:
            status = PaymentStatus.pending
        else:
            status = PaymentStatus.failed
        status = _safe_next_status(previous, status)
        if status != previous:
            self.orders.update_payment_status(str(order["id"]), status.value)
        if status == PaymentStatus.paid:
            was_paid = previous == PaymentStatus.paid
            applied = self.orders.apply_order_stock(str(order["id"]))
            if not applied and not was_paid:
                logger.error("Paid payment could not be matched to available stock for order %s", order["id"])
            if not was_paid:
                paid_order = self.orders.get_order_by_id(str(order["id"]))
                if paid_order is not None:
                    self.notifications.send_order_receipt(paid_order)
        return status

    def _settle(self, payment: dict[str, Any]) -> PaymentStatus:
        """Ask SeevCash about a pending session and persist a final result."""
        if payment["status"] != PaymentStatus.pending:
            return PaymentStatus(payment["status"])
        session = self.gateway.get_session(payment["reference"])
        status = {"success": PaymentStatus.paid, "failed": PaymentStatus.failed}.get(
            session["status"], PaymentStatus.pending
        )
        if status == PaymentStatus.paid:
            _validate_session(payment, session)
        if status != PaymentStatus.pending:
            self.payments.update_payment_status(
                reference=payment["reference"], status=status.value, raw_response=dict(session["data"])
            )
        return status


def verify_webhook_signature(
    secret: str, timestamp: str | None, signature: str | None, raw_body: bytes
) -> bool:
    """Check `v1=` + hex HMAC-SHA256 of `<timestamp>.<raw body>` and that the timestamp is recent."""
    if not (secret and timestamp and signature):
        return False
    try:
        age = abs(time.time() - int(timestamp))
    except ValueError:
        return False
    if age > WEBHOOK_TOLERANCE_SECONDS:
        return False
    digest = hmac.new(secret.encode(), timestamp.encode() + b"." + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"v1={digest}".encode(), signature.encode())


def get_seevcash_gateway() -> SeevcashGateway:
    """Return the configured SeevCash gateway."""
    settings = get_settings()
    if settings.seevcash_api_key:
        return HttpSeevcashGateway(settings.seevcash_base_url, settings.seevcash_api_key)
    return LocalSeevcashGateway()


def _failure_detail(exc: Exception) -> str:
    """Describe a gateway failure for logs: SeevCash's HTTP status and body if present."""
    response = getattr(exc, "response", None)
    if response is not None:
        return f"HTTP {response.status_code} {response.text[:500]}"
    return repr(exc)


def _normalize_status(status: object) -> str:
    """Map a SeevCash session status to success, failed or pending."""
    value = str(status or "").lower()
    if value in {"completed", "success"}:
        return "success"
    if value in {"failed", "cancelled"}:
        return "failed"
    return "pending"


def _is_expired(payment: dict[str, Any]) -> bool:
    """Whether a stored session is lapsed, about to lapse, or has no usable expiry."""
    try:
        expires_at = datetime.fromisoformat(payment["raw_response"]["expires_at"])
        return expires_at <= datetime.now(UTC) + EXPIRY_MARGIN
    except (KeyError, TypeError, ValueError):
        return True


def _validate_session(payment: dict[str, Any], session: dict[str, Any]) -> None:
    """Require SeevCash to confirm our session reference, currency and amount."""
    if session.get("reference") != payment["reference"]:
        raise PaymentValidationError("SeevCash reference does not match payment")
    data = session["data"]
    if data.get("currency", "GHS") != "GHS":
        raise PaymentValidationError("SeevCash currency does not match order")
    amount = data.get("amount")
    if amount is None:
        return
    # Sessions use pesewas; the docs show transactions and webhooks in cedis, and the unit of
    # the status response is not documented, so accept either rather than reject a real payment.
    expected = payment["amount_pesewas"]
    try:
        matches = Decimal(str(amount)) in (Decimal(expected), Decimal(expected) / 100)
    except ArithmeticError:
        matches = False
    if not matches:
        raise PaymentValidationError("SeevCash amount does not match order total")


async def get_seevcash_service() -> SeevcashService:
    """Dependency provider for SeevCash service."""
    return SeevcashService(
        orders=get_order_repository(),
        payments=get_payment_repository(),
        gateway=get_seevcash_gateway(),
        notifications=await get_notification_service(),
    )
