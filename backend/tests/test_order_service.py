from uuid import UUID

import pytest

from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import InMemoryOrderRepository
from app.services.order_service import OrderService, OrderValidationError


DIRECT_PRODUCT_ID = UUID("10000000-0000-4000-8000-000000000001")
QUOTE_PRODUCT_ID = UUID("10000000-0000-4000-8000-000000000003")


def order_payload(product_id: UUID = DIRECT_PRODUCT_ID) -> dict[str, object]:
    return {
        "customer": {
            "name": "Ama Boateng",
            "email": "ama@example.com",
            "phone": "+233201987654",
        },
        "items": [{"product_id": str(product_id), "quantity": 2}],
        "payment_method": "paystack",
        "accepted_returns_policy": True,
    }


def test_create_order_calculates_totals_and_reference() -> None:
    service = OrderService(repository=InMemoryOrderRepository())
    request = CreateOrderRequest.model_validate(order_payload())

    order = service.create_order(request)

    assert order.reference.startswith("CW-")
    assert order.subtotal_pesewas == 30000
    assert order.total_pesewas == 30000
    assert order.payment_status == "pending"
    assert order.order_status == "pending"


def test_create_order_rejects_quote_only_product() -> None:
    service = OrderService(repository=InMemoryOrderRepository())
    request = CreateOrderRequest.model_validate(order_payload(QUOTE_PRODUCT_ID))

    with pytest.raises(OrderValidationError, match="Quote-only products"):
        service.create_order(request)


def test_lookup_order_requires_matching_phone() -> None:
    repository = InMemoryOrderRepository()
    service = OrderService(repository=repository)
    request = CreateOrderRequest.model_validate(order_payload())
    order = service.create_order(request)

    assert service.lookup_order(order.reference, "+233201987654") is not None
    assert service.lookup_order(order.reference, "+233244000000") is None
