from types import SimpleNamespace

from app.core.rate_limit import SlidingWindowRateLimiter, client_key


def test_limiter_allows_up_to_the_limit_then_blocks() -> None:
    limiter = SlidingWindowRateLimiter(limit=3, window_seconds=60)

    assert [limiter.allow("1.2.3.4") for _ in range(3)] == [True, True, True]
    assert limiter.allow("1.2.3.4") is False


def test_limiter_tracks_clients_independently() -> None:
    limiter = SlidingWindowRateLimiter(limit=1, window_seconds=60)

    assert limiter.allow("1.2.3.4") is True
    assert limiter.allow("1.2.3.4") is False
    assert limiter.allow("5.6.7.8") is True


def test_limiter_forgets_hits_older_than_the_window(monkeypatch) -> None:
    clock = {"now": 1_000.0}
    monkeypatch.setattr(
        "app.core.rate_limit.time.monotonic", lambda: clock["now"]
    )
    limiter = SlidingWindowRateLimiter(limit=2, window_seconds=60)

    assert limiter.allow("1.2.3.4") is True
    assert limiter.allow("1.2.3.4") is True
    assert limiter.allow("1.2.3.4") is False

    clock["now"] += 61
    assert limiter.allow("1.2.3.4") is True


def test_client_key_prefers_the_forwarded_address() -> None:
    request = SimpleNamespace(
        headers={"x-forwarded-for": "41.66.1.2, 10.0.0.1"},
        client=SimpleNamespace(host="10.0.0.1"),
    )

    assert client_key(request) == "41.66.1.2"


def test_client_key_falls_back_to_the_socket_address() -> None:
    request = SimpleNamespace(headers={}, client=SimpleNamespace(host="10.0.0.1"))

    assert client_key(request) == "10.0.0.1"
