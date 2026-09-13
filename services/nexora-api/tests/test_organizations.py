import pytest
from django.core.exceptions import ValidationError

from apps.access.services import authorize
from apps.core.exceptions import PermissionDeniedException
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization
from apps.organizations.selectors import get_active_membership, get_user_organizations
from apps.organizations.services import MembershipService, OrganizationService


def make_user(email: str, *, status=NexoraUser.Status.ACTIVE) -> NexoraUser:
    return NexoraUser.objects.create(email=email, display_name=email.split("@")[0], status=status)


@pytest.mark.django_db
def test_user_cannot_see_or_access_another_organization():
    user = make_user("user@example.com")
    own_org = OrganizationService.create_organization(name="Own Org", created_by=user)
    other_user = make_user("other@example.com")
    other_org = OrganizationService.create_organization(name="Other Org", created_by=other_user)

    assert list(get_user_organizations(user)) == [own_org]
    assert get_active_membership(user=user, organization_id=other_org.id) is None

    decision = authorize(user=user, organization=other_org, permission_code="organization.read")
    assert decision.allowed is False
    assert decision.reason == "membership_missing_or_inactive"


@pytest.mark.django_db
def test_membership_role_must_belong_to_same_organization():
    user = make_user("user@example.com")
    first_org = OrganizationService.create_organization(name="First Org", created_by=user)
    second_org = OrganizationService.create_organization(name="Second Org")
    membership = MembershipService.add_user(user=user, organization_id=second_org.id)
    foreign_role = first_org.roles.get(slug="member")

    membership.role = foreign_role
    with pytest.raises(ValidationError):
        membership.full_clean()


@pytest.mark.django_db
def test_inactive_user_cannot_become_organization_owner():
    user = make_user("disabled@example.com", status=NexoraUser.Status.DISABLED)

    with pytest.raises(PermissionDeniedException):
        OrganizationService.create_organization(name="Blocked Org", created_by=user)


@pytest.mark.django_db
def test_membership_cannot_be_added_for_inactive_user():
    creator = make_user("creator@example.com")
    inactive = make_user("inactive@example.com", status=NexoraUser.Status.DISABLED)
    organization = OrganizationService.create_organization(name="Active Org", created_by=creator)

    with pytest.raises(PermissionDeniedException):
        MembershipService.add_user(user=inactive, organization_id=organization.id)


@pytest.mark.django_db
def test_suspended_organization_is_not_visible_or_authorized():
    user = make_user("user@example.com")
    organization = OrganizationService.create_organization(name="Suspended Org", created_by=user)
    OrganizationService.suspend_organization(organization.id)
    organization.refresh_from_db()

    assert organization.status == Organization.Status.SUSPENDED
    assert list(get_user_organizations(user)) == []
    decision = authorize(user=user, organization=organization, permission_code="organization.read")
    assert decision.allowed is False
    assert decision.reason == "organization_inactive"
