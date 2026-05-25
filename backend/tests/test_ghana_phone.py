from app.utils.ghana_phone import is_valid_ghana_phone


def test_valid_ghana_phone_format() -> None:
    assert is_valid_ghana_phone("+233201987654") is True


def test_invalid_ghana_phone_format() -> None:
    assert is_valid_ghana_phone("0201987654") is False
