from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.models.orders import CreateOrderRequest
from app.repositories.order_repository import (
    InMemoryOrderRepository,
    OrderReferenceConflictError,
)
from app.services.catalog_service import _PRODUCT_DATA
from app.services.order_service import (
    OrderService,
    OrderValidationError,
    _generate_order_reference,
)


DIRECT_PRODUCT_ID = UUID("10000000-0000-4000-8000-000000000001")


@pytest.fixture(autouse=True)
def restore_seed_stock() -> Iterator[None]:
    """Keep seed-stock mutations from leaking between tests."""
    snapshot = [
        (product, product.get("stock_qty"), product.get("in_stock"))
        for product in _PRODUCT_DATA
    ]
    yield
    for product, stock_qty, in_stock in snapshot:
        product["stock_qty"] = stock_qty
        product["in_stock"] = in_stock


def order_payload(items: list[dict[str, object]]) -> dict[str, object]:
    return {
        "customer": {
            "name": "Ama Boateng",
            "email": "ama@example.com",
            "phone": "+233201987654",
        },
        "items": items,
        "payment_method": "paystack",
        "accepted_returns_policy": True,
    }


def seed_product() -> dict[str, object]:
    return next(
        product for product in _PRODUCT_DATA if str(product["id"]) == str(DIRECT_PRODUCT_ID)
    )


def test_checkout_rejects_quantity_above_available_stock() -> None:
    service = OrderService(repository=InMemoryOrderRepository())
    seed_product()["stock_qty"] = 3
    request = CreateOrderRequest.model_validate(
        order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 4}])
    )

    with pytest.raises(OrderValidationError, match="Only 3"):
        service.create_order(request)


def test_checkout_rejects_out_of_stock_product() -> None:
    service = OrderService(repository=InMemoryOrderRepository())
    seed_product()["in_stock"] = False
    request = CreateOrderRequest.model_validate(
        order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 1}])
    )

    with pytest.raises(OrderValidationError, match="out of stock"):
        service.create_order(request)


def test_repeated_line_items_are_summed_before_the_stock_check() -> None:
    """Two lines of the same product must not each pass the check separately."""
    service = OrderService(repository=InMemoryOrderRepository())
    seed_product()["stock_qty"] = 5
    request = CreateOrderRequest.model_validate(
        order_payload(
            [
                {"product_id": str(DIRECT_PRODUCT_ID), "quantity": 3},
                {"product_id": str(DIRECT_PRODUCT_ID), "quantity": 3},
            ]
        )
    )

    with pytest.raises(OrderValidationError, match="Only 5"):
        service.create_order(request)


def test_applying_order_stock_decrements_once() -> None:
    repository = InMemoryOrderRepository()
    service = OrderService(repository=repository)
    seed_product()["stock_qty"] = 10
    order = service.create_order(
        CreateOrderRequest.model_validate(
            order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 4}])
        )
    )

    assert repository.apply_order_stock(str(order.id)) is True
    assert seed_product()["stock_qty"] == 6

    assert repository.apply_order_stock(str(order.id)) is False
    assert seed_product()["stock_qty"] == 6


def test_applying_all_remaining_stock_marks_product_out_of_stock() -> None:
    repository = InMemoryOrderRepository()
    service = OrderService(repository=repository)
    seed_product()["stock_qty"] = 2
    order = service.create_order(
        CreateOrderRequest.model_validate(
            order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 2}])
        )
    )

    repository.apply_order_stock(str(order.id))

    assert seed_product()["stock_qty"] == 0
    assert seed_product()["in_stock"] is False


def test_order_references_have_enough_entropy_to_avoid_collisions() -> None:
    """The old 4-digit suffix collided constantly at this sample size.

    A handful of collisions in 5,000 draws is still possible by birthday odds,
    and create_order retries those, so this asserts the rate rather than
    demanding perfection.
    """
    now = datetime.now(UTC)
    references = [_generate_order_reference(now) for _ in range(5_000)]

    assert len(set(references)) >= 4_995
    assert all(reference.startswith(f"CW-{now:%Y%m%d}-") for reference in references)
    assert all(len(reference) == len("CW-20260821-ABCDEF") for reference in references)


def test_create_order_retries_when_a_reference_is_taken() -> None:
    class ConflictOnceRepository(InMemoryOrderRepository):
        def __init__(self) -> None:
            super().__init__()
            self.attempts = 0

        def create_order(self, order, items):  # type: ignore[no-untyped-def]
            self.attempts += 1
            if self.attempts == 1:
                raise OrderReferenceConflictError("taken")
            return super().create_order(order, items)

    repository = ConflictOnceRepository()
    service = OrderService(repository=repository)

    order = service.create_order(
        CreateOrderRequest.model_validate(
            order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 1}])
        )
    )

    assert repository.attempts == 2
    assert order.reference.startswith("CW-")


def test_create_order_fails_cleanly_when_references_keep_colliding() -> None:
    class AlwaysConflictRepository(InMemoryOrderRepository):
        def create_order(self, order, items):  # type: ignore[no-untyped-def]
            raise OrderReferenceConflictError("taken")

    service = OrderService(repository=AlwaysConflictRepository())

    with pytest.raises(OrderValidationError, match="reference could not be generated"):
        service.create_order(
            CreateOrderRequest.model_validate(
                order_payload([{"product_id": str(DIRECT_PRODUCT_ID), "quantity": 1}])
            )
        )
