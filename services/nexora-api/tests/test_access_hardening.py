import pytest
from django.core.exceptions import ValidationError

from apps.access.models import Permission, RolePermission
from apps.access.services import assign_role, provision_organization_access
from apps.core.exceptions import ConflictException, PermissionDeniedException
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


@pytest.mark.django_db
def test_membership_management_requires_organization_permission():
    owner = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    outsider = NexoraUser.objects.create(email="outsider@example.com", status=NexoraUser.Status.ACTIVE)
    target = NexoraUser.objects.create(email="target@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=owner)
    target_membership = MembershipService.add_user(user=target, organization_id=organization.id)

    with pytest.raises(PermissionDeniedException):
        MembershipService.suspend_membership(actor=outsider, membership_id=target_membership.id)

    target_membership.refresh_from_db()
    assert target_membership.status == target_membership.Status.ACTIVE


@pytest.mark.django_db
def test_admin_can_suspend_member_but_cannot_revoke_last_owner():
    owner = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    admin = NexoraUser.objects.create(email="admin@example.com", status=NexoraUser.Status.ACTIVE)
    target = NexoraUser.objects.create(email="target@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=owner)
    admin_membership = MembershipService.add_user(user=admin, organization_id=organization.id)
    target_membership = MembershipService.add_user(user=target, organization_id=organization.id)
    assign_role(actor=owner, membership=admin_membership, role=organization.roles.get(slug="admin"))

    suspended = MembershipService.suspend_membership(actor=admin, membership_id=target_membership.id)
    assert suspended.status == suspended.Status.SUSPENDED

    owner_membership = organization.memberships.get(user=owner)
    with pytest.raises(ConflictException, match="at least one active owner"):
        MembershipService.revoke_membership(actor=owner, membership_id=owner_membership.id)

    owner_membership.refresh_from_db()
    assert owner_membership.status == owner_membership.Status.ACTIVE


@pytest.mark.django_db
def test_owner_cannot_demote_the_last_active_owner():
    owner = NexoraUser.objects.create(email="owner@example.com", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Acme", created_by=owner)
    owner_membership = organization.memberships.get(user=owner)

    with pytest.raises(ConflictException, match="at least one active owner"):
        assign_role(
            actor=owner,
            membership=owner_membership,
            role=organization.roles.get(slug="admin"),
        )

    owner_membership.refresh_from_db()
    assert owner_membership.role.slug == "owner"
