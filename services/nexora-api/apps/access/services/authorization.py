from dataclasses import dataclass

from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


@dataclass(frozen=True)
class AuthorizationDecision:
    allowed: bool
    reason: str
    permission: str
    organization: Organization | None = None
    membership: Membership | None = None


def authorize(*, user: NexoraUser, organization: Organization, permission_code: str) -> AuthorizationDecision:
    if not user or not getattr(user, "id", None) or user.deleted_at is not None or user.status != NexoraUser.Status.ACTIVE:
        return AuthorizationDecision(False, "user_inactive", permission_code)
    if organization.deleted_at is not None or organization.status != Organization.Status.ACTIVE:
        return AuthorizationDecision(False, "organization_inactive", permission_code, organization=organization)
    membership = (
        Membership.objects.active()
        .select_related("role")
        .filter(
            user_id=user.id,
            organization_id=organization.id,
            status=Membership.Status.ACTIVE,
            organization__status=Organization.Status.ACTIVE,
            organization__deleted_at__isnull=True,
        )
        .first()
    )
    if membership is None:
        return AuthorizationDecision(False, "membership_missing_or_inactive", permission_code, organization=organization)
    role = membership.role
    if role is None or role.deleted_at is not None or role.organization_id != organization.id:
        return AuthorizationDecision(False, "role_missing_or_cross_tenant", permission_code, organization, membership)
    permission_exists = role.permissions.filter(
        code=permission_code,
        deleted_at__isnull=True,
    ).exists()
    return AuthorizationDecision(
        permission_exists,
        "allowed" if permission_exists else "permission_missing",
        permission_code,
        organization,
        membership,
    )


def has_permission(*, user: NexoraUser, organization: Organization, permission_code: str) -> bool:
    return authorize(user=user, organization=organization, permission_code=permission_code).allowed
