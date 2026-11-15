from __future__ import annotations

from django.db import IntegrityError, transaction

from apps.access.models import Role
from apps.access.services.authorization import authorize
from apps.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


class MembershipService:
    @staticmethod
    def add_user(*, user: NexoraUser, organization_id) -> Membership:
        if user.deleted_at is not None or user.status != NexoraUser.Status.ACTIVE:
            raise PermissionDeniedException("An inactive identity cannot join an organization.")
        organization = Organization.objects.active().filter(id=organization_id).first()
        if organization is None:
            raise NotFoundException("Organization not found.")
        if organization.status != Organization.Status.ACTIVE:
            raise PermissionDeniedException("Organization is not accepting active memberships.")
        existing = Membership.objects.filter(user=user, organization=organization, deleted_at__isnull=True).first()
        if existing is not None:
            if existing.status == Membership.Status.REVOKED:
                raise ConflictException("A revoked membership cannot be silently reactivated.")
            return existing
        role = Role.objects.active().filter(organization=organization, slug="member").first()
        if role is None:
            raise ConflictException("Organization access roles are not provisioned.")
        try:
            return Membership.objects.create(user=user, organization=organization, role=role)
        except IntegrityError as exc:
            raise ConflictException("An active membership already exists.") from exc

    @staticmethod
    def get_active_membership(*, user: NexoraUser, organization_id) -> Membership:
        membership = (
            Membership.objects.active()
            .select_related("organization")
            .filter(
                user=user,
                organization_id=organization_id,
                status=Membership.Status.ACTIVE,
                organization__deleted_at__isnull=True,
                organization__status=Organization.Status.ACTIVE,
            )
            .first()
        )
        if membership is None:
            raise PermissionDeniedException("Active organization membership is required.")
        return membership

    @staticmethod
    def _lock_membership_for_management(*, membership_id) -> Membership:
        reference = (
            Membership.objects.active()
            .filter(id=membership_id)
            .values("organization_id")
            .first()
        )
        if reference is None:
            raise NotFoundException("Membership not found.")

        organization = Organization.objects.select_for_update().filter(
            id=reference["organization_id"],
            deleted_at__isnull=True,
        ).first()
        if organization is None:
            raise NotFoundException("Organization not found.")

        membership = (
            Membership.objects.select_for_update()
            .select_related("organization", "role")
            .filter(
                id=membership_id,
                organization=organization,
                deleted_at__isnull=True,
            )
            .first()
        )
        if membership is None:
            raise NotFoundException("Membership not found.")
        return membership

    @staticmethod
    def _authorize_management(*, actor: NexoraUser, membership: Membership) -> None:
        decision = authorize(
            user=actor,
            organization=membership.organization,
            permission_code="organization.members.manage",
        )
        if not decision.allowed:
            raise PermissionDeniedException("The actor cannot manage memberships in this organization.")

    @staticmethod
    def _ensure_another_owner_remains(*, membership: Membership) -> None:
        if membership.role.slug != "owner":
            return
        other_active_owners = Membership.objects.active().filter(
            organization_id=membership.organization_id,
            status=Membership.Status.ACTIVE,
            role__slug="owner",
            role__deleted_at__isnull=True,
        ).exclude(id=membership.id).count()
        if other_active_owners == 0:
            raise ConflictException("The organization must retain at least one active owner.")

    @staticmethod
    @transaction.atomic
    def suspend_membership(*, actor: NexoraUser, membership_id) -> Membership:
        membership = MembershipService._lock_membership_for_management(membership_id=membership_id)
        MembershipService._authorize_management(actor=actor, membership=membership)
        if membership.status == Membership.Status.REVOKED:
            raise ConflictException("A revoked membership cannot be suspended.")
        if membership.status == Membership.Status.SUSPENDED:
            return membership
        MembershipService._ensure_another_owner_remains(membership=membership)
        membership.status = Membership.Status.SUSPENDED
        membership.save(update_fields=["status", "updated_at"])
        return membership

    @staticmethod
    @transaction.atomic
    def revoke_membership(*, actor: NexoraUser, membership_id) -> Membership:
        membership = MembershipService._lock_membership_for_management(membership_id=membership_id)
        MembershipService._authorize_management(actor=actor, membership=membership)
        if membership.status == Membership.Status.REVOKED:
            return membership
        MembershipService._ensure_another_owner_remains(membership=membership)
        membership.status = Membership.Status.REVOKED
        membership.save(update_fields=["status", "updated_at"])
        return membership
