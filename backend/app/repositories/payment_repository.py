from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured


class PaymentRepository(Protocol):
    """Payment data access contract."""

    def create_payment(self, payment: dict[str, Any]) -> dict[str, Any]:
        """Persist a payment record."""

    def get_payment_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return a payment by provider reference."""

    def update_payment_status(
        self,
        reference: str,
        status: str,
        raw_response: dict[str, Any],
    ) -> dict[str, Any] | None:
        """Persist payment verification status."""


class InMemoryPaymentRepository:
    """Local payment repository for tests/dev without Supabase credentials."""

    def __init__(self) -> None:
        self.payments: dict[str, dict[str, Any]] = {}

    def create_payment(self, payment: dict[str, Any]) -> dict[str, Any]:
        """Store a payment in memory."""
        payment = {**payment, "id": str(uuid4()), "created_at": datetime.now(UTC)}
        self.payments[payment["reference"]] = payment
        return payment

    def get_payment_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return an in-memory payment by reference."""
        return self.payments.get(reference)

    def update_payment_status(
        self,
        reference: str,
        status: str,
        raw_response: dict[str, Any],
    ) -> dict[str, Any] | None:
        """Update an in-memory payment status."""
        payment = self.payments.get(reference)
        if payment is None:
            return None
        payment["status"] = status
        payment["raw_response"] = raw_response
        return payment


class SupabasePaymentRepository:
    """Payment repository backed by Supabase tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def create_payment(self, payment: dict[str, Any]) -> dict[str, Any]:
        """Persist a payment record."""
        response = self.client.table("payments").insert(payment).execute()
        rows = response_data(response)
        return rows[0]

    def get_payment_by_reference(self, reference: str) -> dict[str, Any] | None:
        """Return a payment by reference."""
        response = (
            self.client.table("payments")
            .select("id,order_id,reference,status,amount_pesewas")
            .eq("provider", "paystack")
            .eq("reference", reference)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None

    def update_payment_status(
        self,
        reference: str,
        status: str,
        raw_response: dict[str, Any],
    ) -> dict[str, Any] | None:
        """Persist payment verification status."""
        response = (
            self.client.table("payments")
            .update({"status": status, "raw_response": raw_response})
            .eq("provider", "paystack")
            .eq("reference", reference)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None


_IN_MEMORY_REPOSITORY = InMemoryPaymentRepository()


def get_payment_repository() -> PaymentRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return _IN_MEMORY_REPOSITORY
    return SupabasePaymentRepository(get_supabase_client())
