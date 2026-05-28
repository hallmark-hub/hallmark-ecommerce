from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import uuid4

from supabase import Client

from app.db.supabase import get_supabase_client, response_data, supabase_is_configured
from app.models.customers import CustomerRegisterRequest


class CustomerRepositoryError(RuntimeError):
    """Raised when customer persistence or auth fails."""


class CustomerRepository(Protocol):
    """Customer account data access contract."""

    def register(self, request: CustomerRegisterRequest) -> dict[str, Any]:
        """Register a customer and profile."""

    def login(self, email: str, password: str) -> dict[str, Any]:
        """Authenticate a customer."""

    def get_profile_for_token(self, token: str) -> dict[str, Any] | None:
        """Return the profile for a bearer token."""

    def list_orders_for_profile(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        """Return orders that belong to a customer profile."""


class InMemoryCustomerRepository:
    """Local customer repository for tests/dev without Supabase credentials."""

    def __init__(self) -> None:
        self.accounts: dict[str, dict[str, Any]] = {}
        self.tokens: dict[str, str] = {}

    def register(self, request: CustomerRegisterRequest) -> dict[str, Any]:
        """Register a local customer account."""
        email = request.email.lower()
        if email in self.accounts:
            raise CustomerRepositoryError("Email is already registered")
        now = datetime.now(UTC)
        user_id = str(uuid4())
        profile = {
            "id": str(uuid4()),
            "auth_user_id": user_id,
            "name": request.name,
            "email": email,
            "phone": request.phone,
            "role": "customer",
            "created_at": now,
            "updated_at": now,
        }
        token = f"local-{uuid4()}"
        self.accounts[email] = {
            "password": request.password,
            "user": {"id": user_id, "email": email},
            "profile": profile,
        }
        self.tokens[token] = email
        return {
            "access_token": token,
            "refresh_token": None,
            "user": self.accounts[email]["user"],
            "profile": profile,
        }

    def login(self, email: str, password: str) -> dict[str, Any]:
        """Authenticate a local customer account."""
        email = email.lower()
        account = self.accounts.get(email)
        if account is None or account["password"] != password:
            raise CustomerRepositoryError("Invalid email or password")
        token = f"local-{uuid4()}"
        self.tokens[token] = email
        return {
            "access_token": token,
            "refresh_token": None,
            "user": account["user"],
            "profile": account["profile"],
        }

    def get_profile_for_token(self, token: str) -> dict[str, Any] | None:
        """Return a local profile for a bearer token."""
        email = self.tokens.get(token)
        if email is None:
            return None
        return self.accounts[email]["profile"]

    def list_orders_for_profile(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        """Return local customer orders."""
        return []


class SupabaseCustomerRepository:
    """Customer repository backed by Supabase Auth and tables."""

    def __init__(self, client: Client) -> None:
        self.client = client

    def register(self, request: CustomerRegisterRequest) -> dict[str, Any]:
        """Register a customer through Supabase Auth and create a profile."""
        try:
            auth_response = self.client.auth.sign_up(
                {
                    "email": request.email,
                    "password": request.password,
                    "options": {
                        "data": {"name": request.name, "phone": request.phone},
                    },
                }
            )
        except Exception as exc:
            raise CustomerRepositoryError("Customer registration failed") from exc

        user = getattr(auth_response, "user", None)
        if user is None:
            raise CustomerRepositoryError("Customer registration failed")
        profile = self._upsert_profile(
            auth_user_id=str(user.id),
            name=request.name,
            email=str(user.email or request.email).lower(),
            phone=request.phone,
            role="customer",
        )
        session = getattr(auth_response, "session", None)
        return {
            "access_token": getattr(session, "access_token", None),
            "refresh_token": getattr(session, "refresh_token", None),
            "user": {"id": str(user.id), "email": str(user.email or request.email).lower()},
            "profile": profile,
        }

    def login(self, email: str, password: str) -> dict[str, Any]:
        """Authenticate a customer through Supabase Auth."""
        try:
            auth_response = self.client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except Exception as exc:
            raise CustomerRepositoryError("Invalid email or password") from exc

        user = getattr(auth_response, "user", None)
        session = getattr(auth_response, "session", None)
        if user is None or session is None:
            raise CustomerRepositoryError("Invalid email or password")
        profile = self._profile_for_auth_user(str(user.id))
        if profile is None:
            profile = self._upsert_profile(
                auth_user_id=str(user.id),
                name=_metadata_value(user, "name") or str(user.email).split("@")[0],
                email=str(user.email).lower(),
                phone=_metadata_value(user, "phone") or "+233000000000",
                role="customer",
            )
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {"id": str(user.id), "email": str(user.email).lower()},
            "profile": profile,
        }

    def get_profile_for_token(self, token: str) -> dict[str, Any] | None:
        """Return a Supabase profile for a bearer token."""
        try:
            user_response = self.client.auth.get_user(token)
        except Exception:
            return None
        user = getattr(user_response, "user", None)
        if user is None:
            return None
        return self._profile_for_auth_user(str(user.id))

    def list_orders_for_profile(self, profile: dict[str, Any]) -> list[dict[str, Any]]:
        """Return customer orders matched by profile email and phone."""
        response = (
            self.client.table("orders")
            .select(
                "id,reference,total_pesewas,payment_method,payment_status,"
                "order_status,returns_policy,created_at"
            )
            .eq("customer_email", profile["email"])
            .eq("customer_phone", profile["phone"])
            .order("created_at", desc=True)
            .execute()
        )
        return response_data(response)

    def _profile_for_auth_user(self, auth_user_id: str) -> dict[str, Any] | None:
        response = (
            self.client.table("customer_profiles")
            .select("id,auth_user_id,name,email,phone,role,created_at,updated_at")
            .eq("auth_user_id", auth_user_id)
            .limit(1)
            .execute()
        )
        rows = response_data(response)
        return rows[0] if rows else None

    def _upsert_profile(
        self,
        auth_user_id: str,
        name: str,
        email: str,
        phone: str,
        role: str,
    ) -> dict[str, Any]:
        existing = self._profile_for_auth_user(auth_user_id)
        row = {
            "auth_user_id": auth_user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "role": role,
        }
        if existing is None:
            response = self.client.table("customer_profiles").insert(row).execute()
        else:
            response = (
                self.client.table("customer_profiles")
                .update(row)
                .eq("auth_user_id", auth_user_id)
                .execute()
            )
        rows = response_data(response)
        if not rows:
            raise CustomerRepositoryError("Customer profile could not be saved")
        return rows[0]


def _metadata_value(user: Any, key: str) -> str | None:
    metadata = getattr(user, "user_metadata", None)
    if isinstance(metadata, dict):
        value = metadata.get(key)
        return str(value) if value else None
    return None


_IN_MEMORY_REPOSITORY = InMemoryCustomerRepository()


def get_customer_repository() -> CustomerRepository:
    """Return Supabase repository when configured, otherwise local memory."""
    if not supabase_is_configured():
        return _IN_MEMORY_REPOSITORY
    return SupabaseCustomerRepository(get_supabase_client())
