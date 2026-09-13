from __future__ import annotations

from django.db import IntegrityError, transaction

from apps.access.models import Role
from apps.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


class MembershipService:
    @staticmethod
    def add_user(*, user: NexoraUser, organization_id) -> Membership:
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
    def suspend_membership(*, membership_id) -> Membership:
        membership = Membership.objects.active().filter(id=membership_id).first()
        if membership is None:
            raise NotFoundException("Membership not found.")
        if membership.status == Membership.Status.REVOKED:
            raise ConflictException("A revoked membership cannot be suspended.")
        membership.status = Membership.Status.SUSPENDED
        membership.save(update_fields=["status", "updated_at"])
        return membership

    @staticmethod
    def revoke_membership(*, membership_id) -> Membership:
        membership = Membership.objects.active().filter(id=membership_id).first()
        if membership is None:
            raise NotFoundException("Membership not found.")
        membership.status = Membership.Status.REVOKED
        membership.save(update_fields=["status", "updated_at"])
        return membership
