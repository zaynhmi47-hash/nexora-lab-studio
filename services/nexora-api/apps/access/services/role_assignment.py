from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions import ConflictException, NotFoundException
from apps.organizations.models import Membership


def assign_role(*, membership: Membership, role) -> Membership:
    if membership.organization_id != role.organization_id:
        raise ValidationError("A membership can only receive a role from its organization.")
    if membership.deleted_at is not None or role.deleted_at is not None:
        raise NotFoundException("Membership or role not found.")
    try:
        membership.role = role
        membership.full_clean()
        membership.save(update_fields=["role", "updated_at"])
    except IntegrityError as exc:
        raise ConflictException("Unable to assign role.") from exc
    return membership
