from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.access.services.authorization import authorize
from apps.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from apps.organizations.models import Membership


def assign_role(*, actor, membership: Membership, role) -> Membership:
    if membership.organization_id != role.organization_id:
        raise ValidationError("A membership can only receive a role from its organization.")
    if membership.deleted_at is not None or role.deleted_at is not None:
        raise NotFoundException("Membership or role not found.")
    decision = authorize(
        user=actor,
        organization=membership.organization,
        permission_code="organization.roles.manage",
    )
    if not decision.allowed:
        raise PermissionDeniedException("The actor cannot manage roles in this organization.")
    if membership.status != Membership.Status.ACTIVE:
        raise ValidationError("Only active memberships can receive a role.")
    if role.is_system and role.slug == "owner" and decision.membership.role.slug != "owner":
        raise PermissionDeniedException("Only an owner can assign the owner role.")
    try:
        membership.role = role
        membership.full_clean()
        membership.save(update_fields=["role", "updated_at"])
    except IntegrityError as exc:
        raise ConflictException("Unable to assign role.") from exc
    return membership
