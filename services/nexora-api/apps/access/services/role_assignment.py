from django.core.exceptions import ValidationError
from django.db import transaction

from apps.access.services.authorization import authorize
from apps.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from apps.organizations.models import Membership, Organization
from apps.access.models import Role


@transaction.atomic
def assign_role(*, actor, membership: Membership, role: Role) -> Membership:
    membership_reference = (
        Membership.objects.active()
        .filter(id=membership.pk)
        .values("organization_id")
        .first()
    )
    if membership_reference is None:
        raise NotFoundException("Membership not found.")

    organization = Organization.objects.select_for_update().filter(
        id=membership_reference["organization_id"],
        deleted_at__isnull=True,
    ).first()
    if organization is None:
        raise NotFoundException("Organization not found.")

    target = (
        Membership.objects.select_for_update()
        .select_related("organization", "role")
        .filter(id=membership.pk, organization=organization, deleted_at__isnull=True)
        .first()
    )
    if target is None:
        raise NotFoundException("Membership not found.")

    target_role = Role.objects.active().filter(
        id=role.pk,
        organization=organization,
    ).first()
    if target_role is None:
        raise ValidationError("A membership can only receive an active role from its organization.")
    if target.status != Membership.Status.ACTIVE:
        raise ValidationError("Only active memberships can receive a role.")

    decision = authorize(
        user=actor,
        organization=organization,
        permission_code="organization.roles.manage",
    )
    if not decision.allowed:
        raise PermissionDeniedException("The actor cannot manage roles in this organization.")

    actor_is_owner = decision.membership.role.slug == "owner"
    if target_role.is_system and target_role.slug == "owner" and not actor_is_owner:
        raise PermissionDeniedException("Only an owner can assign the owner role.")

    if target.role.slug == "owner" and target_role.slug != "owner":
        other_active_owners = Membership.objects.active().filter(
            organization=organization,
            status=Membership.Status.ACTIVE,
            role__slug="owner",
            role__deleted_at__isnull=True,
        ).exclude(id=target.id).count()
        if other_active_owners == 0:
            raise ConflictException("The organization must retain at least one active owner.")

    target.role = target_role
    target.full_clean()
    target.save(update_fields=["role", "updated_at"])
    return target
