from app.models.orders import PaymentMethod, PaymentStatus
from app.models.payments import BankCode, BankTransferResponse
from app.repositories.order_repository import OrderRepository, get_order_repository
from app.repositories.payment_repository import PaymentRepository, get_payment_repository


BANK_DETAILS = {
    BankCode.gcb: {
        "bank_name": "GCB Bank",
        "branch": "TBC",
        "account_name": "TBC",
        "account_number": "TBC",
    },
    BankCode.stanbic: {
        "bank_name": "Stanbic Bank",
        "branch": "TBC",
        "account_name": "TBC",
        "account_number": "TBC",
    },
}


class BankTransferValidationError(ValueError):
    """Raised when a bank transfer request violates business rules."""


class BankTransferService:
    """Manual bank transfer business logic."""

    def __init__(
        self,
        orders: OrderRepository,
        payments: PaymentRepository,
    ) -> None:
        self.orders = orders
        self.payments = payments

    def create_bank_transfer(
        self,
        order_id: str,
        bank: BankCode,
    ) -> BankTransferResponse:
        """Return manual transfer instructions for a bank-transfer order."""
        order = self.orders.get_order_by_id(order_id)
        if order is None:
            raise BankTransferValidationError("Order not found")
        if order["payment_method"] != PaymentMethod.bank_transfer:
            raise BankTransferValidationError("Order payment method is not bank transfer")
        if order["payment_status"] == PaymentStatus.paid:
            raise BankTransferValidationError("Order has already been paid")

        details = BANK_DETAILS[bank]
        existing = self.payments.get_payment_by_reference(order["reference"])
        if existing is None:
            self.payments.create_payment(
                {
                    "order_id": order["id"],
                    "provider": PaymentMethod.bank_transfer.value,
                    "reference": order["reference"],
                    "status": PaymentStatus.pending.value,
                    "amount_pesewas": order["total_pesewas"],
                    "bank": bank.value,
                    "raw_response": details,
                }
            )

        amount_label = f"GHS {order['total_pesewas'] / 100:.2f}"
        return BankTransferResponse(
            reference=order["reference"],
            bank_name=details["bank_name"],
            branch=details["branch"],
            account_name=details["account_name"],
            account_number=details["account_number"],
            amount_pesewas=order["total_pesewas"],
            instructions=(
                f"Transfer exactly {amount_label} and use reference "
                f"{order['reference']} as payment narration."
            ),
        )


async def get_bank_transfer_service() -> BankTransferService:
    """Dependency provider for bank transfer service."""
    return BankTransferService(
        orders=get_order_repository(),
        payments=get_payment_repository(),
    )
