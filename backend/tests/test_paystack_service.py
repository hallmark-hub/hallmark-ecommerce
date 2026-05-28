from uuid import UUID

import pytest

from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.order_service import OrderService
from app.services.paystack_service import (
    LocalPaystackGateway,
    PaystackGatewayError,
    PaymentValidationError,
    PaystackService,
)


def create_order(repository: InMemoryOrderRepository) -> str:
    order = OrderService(repository=repository).create_order(
        CreateOrderRequest.model_validate(
            {
                "customer": {
                    "name": "Ama Boateng",
                    "email": "ama@example.com",
                    "phone": "+233201987654",
                },
                "items": [
                    {
                        "product_id": "10000000-0000-4000-8000-000000000001",
                        "quantity": 2,
                    }
                ],
                "payment_method": "paystack",
                "accepted_returns_policy": True,
            }
        )
    )
    return str(order.id)


def test_paystack_initialize_and_verify_update_status() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, LocalPaystackGateway())

    initialized = service.initialize(order_id)
    verified = service.verify(initialized.reference)

    assert initialized.authorization_url.startswith("https://checkout.paystack.com/")
    assert verified.payment_status == "paid"
    assert verified.order_id == UUID(order_id)
    assert orders.get_order_by_id(order_id)["payment_status"] == "paid"


def test_paystack_initialize_is_idempotent_for_existing_payment() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, LocalPaystackGateway())

    first = service.initialize(order_id)
    second = service.initialize(order_id)

    assert first == second
    assert len(payments.payments) == 1


def test_paystack_initialize_rejects_missing_order() -> None:
    service = PaystackService(
        InMemoryOrderRepository(),
        InMemoryPaymentRepository(),
        LocalPaystackGateway(),
    )

    with pytest.raises(PaymentValidationError, match="Order not found"):
        service.initialize("missing-order")


class AmountMismatchGateway(LocalPaystackGateway):
    def verify(self, reference: str) -> dict[str, object]:
        return {"reference": reference, "status": "success", "amount": 1}


class FailedGateway(LocalPaystackGateway):
    def verify(self, reference: str) -> dict[str, object]:
        return {"reference": reference, "status": "failed", "amount": 30000}


class FailingInitializeGateway(LocalPaystackGateway):
    def initialize(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str | None = None,
    ) -> dict[str, str]:
        raise PaystackGatewayError("Paystack initialization failed")


class FailingVerifyGateway(LocalPaystackGateway):
    def verify(self, reference: str) -> dict[str, object]:
        raise PaystackGatewayError("Paystack verification failed")


def test_paystack_verify_rejects_amount_mismatch() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, LocalPaystackGateway())
    initialized = service.initialize(order_id)
    mismatch_service = PaystackService(orders, payments, AmountMismatchGateway())

    with pytest.raises(PaymentValidationError, match="amount does not match"):
        mismatch_service.verify(initialized.reference)


def test_paystack_verify_does_not_downgrade_paid_payment() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, LocalPaystackGateway())
    initialized = service.initialize(order_id)
    service.verify(initialized.reference)
    failed_service = PaystackService(orders, payments, FailedGateway())

    verified = failed_service.verify(initialized.reference)

    assert verified.payment_status == "paid"
    assert payments.get_payment_by_reference(initialized.reference)["status"] == "paid"


def test_paystack_initialize_wraps_gateway_failure() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, FailingInitializeGateway())

    with pytest.raises(PaymentValidationError, match="Paystack initialization failed"):
        service.initialize(order_id)


def test_paystack_verify_wraps_gateway_failure() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders)
    service = PaystackService(orders, payments, LocalPaystackGateway())
    initialized = service.initialize(order_id)
    failing_service = PaystackService(orders, payments, FailingVerifyGateway())

    with pytest.raises(PaymentValidationError, match="Paystack verification failed"):
        failing_service.verify(initialized.reference)
