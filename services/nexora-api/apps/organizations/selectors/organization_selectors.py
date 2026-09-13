from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


def get_organization_by_id(organization_id) -> Organization | None:
    return Organization.objects.active().filter(id=organization_id).first()


def get_organization_by_slug(slug: str) -> Organization | None:
    return Organization.objects.active().filter(slug__iexact=slug).first()


def get_active_membership(*, user: NexoraUser, organization_id) -> Membership | None:
    return (
        Membership.objects.active()
        .select_related("organization")
        .filter(
            user=user,
            organization_id=organization_id,
            status=Membership.Status.ACTIVE,
            organization__status=Organization.Status.ACTIVE,
            organization__deleted_at__isnull=True,
        )
        .first()
    )


def get_user_organizations(user: NexoraUser):
    return Organization.objects.active().filter(
        memberships__user=user,
        memberships__status=Membership.Status.ACTIVE,
        memberships__deleted_at__isnull=True,
        status=Organization.Status.ACTIVE,
    ).distinct()
