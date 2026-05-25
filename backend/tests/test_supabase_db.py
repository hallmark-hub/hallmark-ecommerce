from types import SimpleNamespace

from app.db.supabase import response_data


def test_response_data_returns_list_payload() -> None:
    response = SimpleNamespace(data=[{"id": "one"}])

    assert response_data(response) == [{"id": "one"}]


def test_response_data_ignores_non_list_payload() -> None:
    response = SimpleNamespace(data={"id": "one"})

    assert response_data(response) == []
