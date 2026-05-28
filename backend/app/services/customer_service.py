from app.models.customers import (
    CustomerAuthResponse,
    CustomerLoginRequest,
    CustomerOrderSummary,
    CustomerProfile,
    CustomerRegisterRequest,
)
from app.repositories.customer_repository import (
    CustomerRepository,
    CustomerRepositoryError,
    get_customer_repository,
)


class CustomerServiceError(ValueError):
    """Raised when a customer request cannot be completed."""


class CustomerService:
    """Customer account business logic."""

    def __init__(self, repository: CustomerRepository) -> None:
        self.repository = repository

    def register(self, request: CustomerRegisterRequest) -> CustomerAuthResponse:
        """Register a customer account."""
        try:
            auth = self.repository.register(request)
        except CustomerRepositoryError as exc:
            raise CustomerServiceError(str(exc)) from exc
        return CustomerAuthResponse.model_validate(auth)

    def login(self, request: CustomerLoginRequest) -> CustomerAuthResponse:
        """Authenticate a customer account."""
        try:
            auth = self.repository.login(str(request.email), request.password)
        except CustomerRepositoryError as exc:
            raise CustomerServiceError(str(exc)) from exc
        return CustomerAuthResponse.model_validate(auth)

    def get_profile_for_token(self, token: str) -> CustomerProfile | None:
        """Return the authenticated customer profile for a bearer token."""
        profile = self.repository.get_profile_for_token(token)
        return CustomerProfile.model_validate(profile) if profile is not None else None

    def list_orders_for_profile(
        self,
        profile: CustomerProfile,
    ) -> list[CustomerOrderSummary]:
        """Return order history for an authenticated customer."""
        rows = self.repository.list_orders_for_profile(profile.model_dump(mode="json"))
        return [CustomerOrderSummary.model_validate(row) for row in rows]


def get_customer_service() -> CustomerService:
    """Return the customer service."""
    return CustomerService(get_customer_repository())
