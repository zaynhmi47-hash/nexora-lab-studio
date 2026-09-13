import pytest
from django.core.exceptions import ValidationError

from apps.access.models import Permission, RolePermission
from apps.access.services import assign_role, provision_organization_access
from apps.core.exceptions import PermissionDeniedException
from apps.identity.models import NexoraUser
from apps.organizations.services import MembershipService, OrganizationService


@pytest.mark.django_db
def test_system_permission_cannot_be_deleted_or_reidentified():
    permission = Permission.objects.create(
        code="organization.read",
        name="Organization read",
        is_system=True,
    )

    with pytest.raises(ValidationError):
        permission.soft_delete()

    permission.code = "organization.write"
    with pytest.raises(ValidationError):
        permission.full_clean()


@pytest.mark.django_db
def test_system_role_cannot_receive_extra_permission():
    user = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=user)
    roles = provision_organization_access(organization)
    extra = Permission.objects.create(code="billing.export", name="Billing export")

    with pytest.raises(ValidationError):
        RolePermission.objects.create(role=roles["member"], permission=extra)


@pytest.mark.django_db
def test_non_owner_cannot_assign_owner_role():
    owner = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    member_user = NexoraUser.objects.create(email="member@example.com", status=NexoraUser.Status.ACTIVE)
    target_user = NexoraUser.objects.create(email="target@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=owner)
    target_membership = MembershipService.add_user(user=target_user, organization_id=organization.id)
    member_membership = MembershipService.add_user(user=member_user, organization_id=organization.id)

    with pytest.raises(PermissionDeniedException):
        assign_role(
            actor=member_user,
            membership=target_membership,
            role=organization.roles.get(slug="owner"),
        )

    assert target_membership.role.slug == "member"
    assert member_membership.role.slug == "member"


@pytest.mark.django_db
def test_owner_can_assign_non_owner_role():
    owner = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    target_user = NexoraUser.objects.create(email="target@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=owner)
    target_membership = MembershipService.add_user(user=target_user, organization_id=organization.id)

    assign_role(
        actor=owner,
        membership=target_membership,
        role=organization.roles.get(slug="admin"),
    )

    target_membership.refresh_from_db()
    assert target_membership.role.slug == "admin"
