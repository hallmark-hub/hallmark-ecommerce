from uuid import UUID

import pytest

from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.order_service import OrderService
from app.services.paystack_service import (
    LocalPaystackGateway,
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


def test_paystack_initialize_rejects_missing_order() -> None:
    service = PaystackService(
        InMemoryOrderRepository(),
        InMemoryPaymentRepository(),
        LocalPaystackGateway(),
    )

    with pytest.raises(PaymentValidationError, match="Order not found"):
        service.initialize("missing-order")
