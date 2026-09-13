import uuid

from apps.core.constants import MAX_CORRELATION_ID_LENGTH


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


def generate_correlation_id() -> str:
    return str(generate_uuid())


def validate_correlation_id(value: str) -> bool:
    if not value or len(value) > MAX_CORRELATION_ID_LENGTH:
        return False
    return all(character.isalnum() or character in "-_." for character in value)
