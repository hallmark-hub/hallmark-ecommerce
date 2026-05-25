import re


GHANA_PHONE_PATTERN = re.compile(r"^\+233[0-9]{9}$")


def is_valid_ghana_phone(value: str) -> bool:
    """Return whether a phone number is in +233XXXXXXXXX format."""
    return bool(GHANA_PHONE_PATTERN.fullmatch(value))
