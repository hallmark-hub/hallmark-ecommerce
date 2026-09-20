from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import jwt
import pytest

from app.repositories import customer_repository as cr


PROJECT_URL = "https://project.supabase.co"


def _repository(monkeypatch: pytest.MonkeyPatch, jwt_secret: str):
    """Build a Supabase repository whose only live part is token verification."""
    monkeypatch.setattr(cr, "_jwk_client", None)
    monkeypatch.setattr(
        cr,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_jwt_secret=jwt_secret,
            supabase_url=PROJECT_URL,
        ),
    )
    repository = object.__new__(cr.SupabaseCustomerRepository)
    repository._profile_for_auth_user = lambda user_id: {"auth_user_id": user_id}
    return repository


def _token(secret: str, algorithm: str = "HS256", **overrides: object) -> str:
    claims: dict[str, object] = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "aud": "authenticated",
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }
    claims.update(overrides)
    return jwt.encode(claims, secret, algorithm=algorithm)


def test_token_signed_with_empty_secret_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A forged HS256 token must not verify when no HS secret is configured."""
    repository = _repository(monkeypatch, jwt_secret="")

    assert repository.get_profile_for_token(_token("")) is None


def test_token_signed_with_wrong_secret_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A token signed with another secret must not verify."""
    repository = _repository(monkeypatch, jwt_secret="real-secret")

    assert repository.get_profile_for_token(_token("attacker-secret")) is None


def test_token_with_unsupported_algorithm_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An unsigned `alg: none` token must not verify."""
    repository = _repository(monkeypatch, jwt_secret="real-secret")
    unsigned = jwt.encode(
        {
            "sub": "11111111-1111-1111-1111-111111111111",
            "aud": "authenticated",
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        key="",
        algorithm="none",
    )

    assert repository.get_profile_for_token(unsigned) is None


def test_token_without_expiry_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    """A token that never expires must not verify."""
    repository = _repository(monkeypatch, jwt_secret="real-secret")
    forever = jwt.encode(
        {"sub": "11111111-1111-1111-1111-111111111111", "aud": "authenticated"},
        "real-secret",
        algorithm="HS256",
    )

    assert repository.get_profile_for_token(forever) is None


def test_expired_token_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    """An expired token must not verify."""
    repository = _repository(monkeypatch, jwt_secret="real-secret")
    expired = _token("real-secret", exp=datetime.now(UTC) - timedelta(seconds=1))

    assert repository.get_profile_for_token(expired) is None


def test_valid_hs256_token_resolves_the_profile(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A correctly signed token resolves to the matching profile."""
    repository = _repository(monkeypatch, jwt_secret="real-secret")

    profile = repository.get_profile_for_token(_token("real-secret"))

    assert profile == {"auth_user_id": "11111111-1111-1111-1111-111111111111"}
