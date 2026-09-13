import uuid

from django.core.exceptions import ValidationError

from apps.core.constants import MAX_CORRELATION_ID_LENGTH
from apps.core.utilities.ids import validate_correlation_id


def validate_uuid(value: str | uuid.UUID) -> None:
    try:
        uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError) as exc:
        raise ValidationError("Enter a valid UUID.") from exc


def validate_safe_correlation_id(value: str) -> None:
    if not isinstance(value, str) or len(value) > MAX_CORRELATION_ID_LENGTH or not validate_correlation_id(value):
        raise ValidationError("Enter a valid correlation ID.")
