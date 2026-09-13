import pytest

from apps.access.models import Permission, Role, RolePermission
from apps.access.services.authorization import authorize
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


@pytest.mark.django_db
def test_authorize_allows_active_member_with_permission():
    organization = Organization.objects.create(name="Acme", slug="acme")
    user = NexoraUser.objects.create(email="member@example.com", status=NexoraUser.Status.ACTIVE)
    role = Role.objects.create(organization=organization, name="Admin", slug="admin")
    permission = Permission.objects.create(code="organization.read", name="Read organization")
    RolePermission.objects.create(role=role, permission=permission)
    Membership.objects.create(user=user, organization=organization, role=role)

    decision = authorize(user=user, organization=organization, permission_code="organization.read")

    assert decision.allowed is True
    assert decision.reason == "allowed"


@pytest.mark.django_db
def test_authorize_denies_missing_membership():
    organization = Organization.objects.create(name="Acme", slug="acme")
    user = NexoraUser.objects.create(email="member@example.com", status=NexoraUser.Status.ACTIVE)

    decision = authorize(user=user, organization=organization, permission_code="organization.read")

    assert decision.allowed is False
    assert decision.reason == "membership_missing_or_inactive"


@pytest.mark.django_db
def test_authorize_denies_cross_tenant_role():
    organization = Organization.objects.create(name="Acme", slug="acme")
    other_organization = Organization.objects.create(name="Other", slug="other")
    user = NexoraUser.objects.create(email="member@example.com", status=NexoraUser.Status.ACTIVE)
    role = Role.objects.create(organization=other_organization, name="Admin", slug="admin")

    Membership.objects.create(user=user, organization=organization, role=role)

    decision = authorize(user=user, organization=organization, permission_code="organization.read")

    assert decision.allowed is False
    assert decision.reason == "role_missing_or_cross_tenant"


@pytest.mark.django_db
def test_authorize_denies_soft_deleted_permission():
    organization = Organization.objects.create(name="Acme", slug="acme")
    user = NexoraUser.objects.create(email="member@example.com", status=NexoraUser.Status.ACTIVE)
    role = Role.objects.create(organization=organization, name="Member", slug="member")
    permission = Permission.objects.create(code="organization.read", name="Read organization")
    RolePermission.objects.create(role=role, permission=permission)
    Membership.objects.create(user=user, organization=organization, role=role)
    permission.soft_delete()

    decision = authorize(user=user, organization=organization, permission_code="organization.read")

    assert decision.allowed is False
    assert decision.reason == "permission_missing"
