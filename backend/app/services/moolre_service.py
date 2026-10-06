from decimal import Decimal, InvalidOperation
from typing import Any, Protocol

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.orders import PaymentMethod, PaymentStatus
from app.models.payments import InitializeMoolreResponse, VerifyMoolreResponse
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.payment_repository import PaymentRepository, get_payment_repository
from app.services.notification_service import NotificationService, get_notification_service
from app.services.paystack_service import PaymentValidationError, _safe_next_status

logger = get_logger(__name__)


class MoolreGatewayError(RuntimeError):
    """Raised when Moolre API communication fails."""


class MoolreGateway(Protocol):
    """Moolre API boundary."""

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str,
        redirect_url: str,
    ) -> dict[str, str]:
        """Generate a Moolre hosted payment link."""

    def verify(self, reference: str) -> dict[str, object]:
        """Fetch the payment status for an external reference."""


class LocalMoolreGateway:
    """Local Moolre gateway for dev/tests without external calls."""

    _amounts: dict[str, int] = {}

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str,
        redirect_url: str,
    ) -> dict[str, str]:
        """Return deterministic local checkout data."""
        self._amounts[reference] = amount_pesewas
        return {"authorization_url": f"https://pos.moolre.com/local-{reference}", "reference": reference}

    def verify(self, reference: str) -> dict[str, object]:
        """Return deterministic local verification data."""
        return {
            "reference": reference,
            "status": "success",
            "amount": self._amounts[reference],
            "currency": "GHS",
            "account_number": get_settings().moolre_account_number,
        }


class HttpMoolreGateway:
    """HTTP Moolre gateway for configured environments."""

    def __init__(self, base_url: str, api_user: str, public_key: str, account_number: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.account_number = account_number
        self.headers = {"X-API-USER": api_user, "X-API-PUBKEY": public_key}

    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str,
        redirect_url: str,
    ) -> dict[str, str]:
        """Generate a hosted payment link through the Moolre API."""
        payload = {
            "type": 1,
            "amount": _pesewas_to_cedis(amount_pesewas),
            "email": email,
            "externalref": reference,
            "callback": callback_url,
            "redirect": redirect_url,
            "reusable": "0",
            "currency": "GHS",
            "accountnumber": self.account_number,
        }
        try:
            response = httpx.post(f"{self.base_url}/embed/link", headers=self.headers, json=payload, timeout=15)
            response.raise_for_status()
            body = response.json()
            if body.get("status") != 1:
                logger.error("Moolre rejected payment link for %s: %s", reference, body)
                raise MoolreGatewayError(f"Moolre rejected the payment: {body.get('code')}")
            return {
                "authorization_url": body["data"]["authorization_url"],
                "reference": reference,
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            logger.error("Moolre initialization failed for %s: %s", reference, _failure_detail(exc))
            raise MoolreGatewayError("Moolre initialization failed") from exc

    def verify(self, reference: str) -> dict[str, object]:
        """Fetch payment status through the Moolre status API."""
        payload = {"type": 1, "idtype": 1, "id": reference, "accountnumber": self.account_number}
        try:
            response = httpx.post(
                f"{self.base_url}/open/transact/status", headers=self.headers, json=payload, timeout=15
            )
            response.raise_for_status()
            body = response.json()
            data = body["data"]
            if not isinstance(data, dict) or not data:
                return {"reference": reference, "status": "pending"}
            return {
                "reference": data.get("externalref"),
                # Only txstatus 1 is documented (success); anything else stays pending.
                "status": "success" if data.get("txstatus") == 1 and body.get("status") == 1 else "pending",
                "amount": _cedis_to_pesewas(data.get("amount")),
                "currency": "GHS",
                "account_number": str(data.get("accountnumber", "")),
                "raw": body,
            }
        except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
            raise MoolreGatewayError("Moolre verification failed") from exc


class MoolreService:
    """Moolre payment business logic."""

    def __init__(
        self,
        orders: OrderRepository,
        payments: PaymentRepository,
        gateway: MoolreGateway,
        notifications: NotificationService,
    ) -> None:
        self.orders = orders
        self.payments = payments
        self.gateway = gateway
        self.notifications = notifications

    def initialize(self, order_id: str) -> InitializeMoolreResponse:
        """Initialize payment for an existing Moolre order."""
        order = self.orders.get_order_by_id(order_id)
        if order is None:
            raise PaymentValidationError("Order not found")
        if order["payment_method"] != PaymentMethod.moolre:
            raise PaymentValidationError("Order payment method is not Moolre")
        if order["payment_status"] == PaymentStatus.paid:
            raise PaymentValidationError("Order has already been paid")
        existing = self.payments.get_payment_by_reference(order["reference"])
        if existing is not None:
            return InitializeMoolreResponse(
                authorization_url=existing["provider_authorization_url"],
                reference=existing["reference"],
            )

        settings = get_settings()
        frontend = settings.frontend_url.rstrip("/")
        backend = str(settings.backend_url).rstrip("/")
        try:
            initialized = self.gateway.initialize(
                email=order["customer_email"],
                amount_pesewas=order["total_pesewas"],
                reference=order["reference"],
                callback_url=f"{backend}/api/v1/payments/moolre/webhook",
                # Moolre does not append the reference, so carry it in the URL.
                redirect_url=f"{frontend}/payment/verify?reference={order['reference']}",
            )
        except MoolreGatewayError as exc:
            raise PaymentValidationError(str(exc)) from exc
        if initialized.get("reference") != order["reference"]:
            raise PaymentValidationError("Moolre returned an unexpected reference")
        self.payments.create_payment(
            {
                "order_id": order["id"],
                "provider": PaymentMethod.moolre.value,
                "reference": order["reference"],
                "status": PaymentStatus.pending.value,
                "amount_pesewas": order["total_pesewas"],
                "provider_authorization_url": initialized["authorization_url"],
                "raw_response": initialized,
            }
        )
        return InitializeMoolreResponse.model_validate(initialized)

    def verify(self, reference: str) -> VerifyMoolreResponse:
        """Verify Moolre payment status server-side and persist the result."""
        payment = self.payments.get_payment_by_reference(reference)
        if payment is None:
            raise PaymentValidationError("Payment not found")

        try:
            verified = self.gateway.verify(reference)
        except MoolreGatewayError as exc:
            raise PaymentValidationError(str(exc)) from exc
        payment_status = PaymentStatus.pending
        if verified.get("status") == "success":
            _validate_moolre_payment(reference, payment, verified)
            payment_status = PaymentStatus.paid
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
        return VerifyMoolreResponse(
            reference=reference,
            payment_status=payment_status,
            order_id=payment["order_id"],
        )

    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, bool]:
        """Record a Moolre callback and confirm it through the status API.

        Moolre callbacks are unsigned, so the payload is never trusted for
        payment state: it only identifies the reference to verify server-side.
        """
        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        reference = str(data.get("externalref") or "")
        event_key = f"callback:{reference}:{data.get('transactionid')}"
        if self.payments.payment_event_exists(PaymentMethod.moolre.value, event_key):
            return {"received": True}

        payment = self.payments.get_payment_by_reference(reference) if reference else None
        if payment is not None:
            try:
                self.verify(reference)
            except PaymentValidationError:
                # Leave the event unrecorded so Moolre's retry is not deduplicated.
                logger.exception("Moolre callback verification failed for %s", reference)
                return {"received": True}
        self.payments.create_payment_event(
            {
                "payment_id": payment.get("id") if payment is not None else None,
                "order_id": payment.get("order_id") if payment is not None else None,
                "provider": PaymentMethod.moolre.value,
                "event_key": event_key,
                "event_type": "callback",
                "reference": reference or None,
                "payload": payload,
                "signature_valid": False,
            }
        )
        return {"received": True}


def get_moolre_gateway() -> MoolreGateway:
    """Return the configured Moolre gateway."""
    settings = get_settings()
    if settings.moolre_api_user and settings.moolre_account_number:
        return HttpMoolreGateway(
            settings.moolre_base_url,
            settings.moolre_api_user,
            settings.moolre_public_key,
            settings.moolre_account_number,
        )
    return LocalMoolreGateway()


def _failure_detail(exc: Exception) -> str:
    """Describe a gateway failure for logs: Moolre's HTTP status and body if present."""
    response = getattr(exc, "response", None)
    if response is not None:
        return f"HTTP {response.status_code} {response.text[:500]}"
    return repr(exc)


def _pesewas_to_cedis(amount_pesewas: int) -> str:
    return f"{Decimal(amount_pesewas) / 100:.2f}"


def _cedis_to_pesewas(amount: object) -> int | None:
    try:
        return int((Decimal(str(amount)) * 100).to_integral_value())
    except (InvalidOperation, ValueError):
        return None


def _validate_moolre_payment(
    reference: str,
    payment: dict[str, Any],
    result: dict[str, Any],
) -> None:
    """Require Moolre to confirm reference, exact amount and our account number."""
    if result.get("reference") != reference:
        raise PaymentValidationError("Moolre reference does not match payment")
    if result.get("amount") != payment["amount_pesewas"]:
        raise PaymentValidationError("Moolre amount does not match order total")
    if result.get("account_number") != get_settings().moolre_account_number:
        raise PaymentValidationError("Moolre account does not match merchant account")


async def get_moolre_service() -> MoolreService:
    """Dependency provider for Moolre service."""
    return MoolreService(
        orders=get_order_repository(),
        payments=get_payment_repository(),
        gateway=get_moolre_gateway(),
        notifications=await get_notification_service(),
    )
