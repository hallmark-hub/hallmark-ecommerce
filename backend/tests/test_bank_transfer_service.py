from app.models.orders import CreateOrderRequest
from app.models.payments import BankCode
from app.repositories.order_repository import InMemoryOrderRepository
from app.repositories.payment_repository import InMemoryPaymentRepository
from app.services.bank_transfer_service import (
    BankTransferService,
    BankTransferValidationError,
)
from app.services.order_service import OrderService

import pytest


def create_order(repository: InMemoryOrderRepository, payment_method: str) -> str:
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
                "payment_method": payment_method,
                "accepted_returns_policy": True,
            }
        )
    )
    return str(order.id)


def test_bank_transfer_returns_placeholder_instructions() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders, "bank_transfer")
    service = BankTransferService(orders, payments)

    transfer = service.create_bank_transfer(order_id, BankCode.gcb)

    assert transfer.bank_name == "GCB Bank"
    assert transfer.account_number == "TBC"
    assert transfer.amount_pesewas == 30000
    assert transfer.reference in transfer.instructions
    assert payments.get_payment_by_reference(transfer.reference)["status"] == "pending"


def test_bank_transfer_rejects_paystack_order() -> None:
    orders = InMemoryOrderRepository()
    payments = InMemoryPaymentRepository()
    order_id = create_order(orders, "paystack")
    service = BankTransferService(orders, payments)

    with pytest.raises(BankTransferValidationError, match="not bank transfer"):
        service.create_bank_transfer(order_id, BankCode.gcb)
