import pytest
from rest_framework.test import APIClient

from apps.academic.models import AcademicStudyPlan, AcademicTerm
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.mark.django_db
def test_study_plan_api_only_lists_current_users_plans():
    user = NexoraUser.objects.create(email="krs-api@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="KRS API School", created_by=user)
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f"/api/v1/organizations/{organization.id}/academic/study-plans/")
    assert response.status_code == 200
    assert response.data["data"] == []


@pytest.mark.django_db
def test_study_plan_detail_is_not_visible_to_another_member():
    owner = NexoraUser.objects.create(email="krs-owner-api@school.test", status=NexoraUser.Status.ACTIVE)
    other = NexoraUser.objects.create(email="krs-other-api@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="KRS Ownership School", created_by=owner)
    membership = Membership.objects.filter(organization=organization, user=owner).first()
    Membership.objects.create(user=other, organization=organization, role=membership.role)
    term = AcademicTerm.objects.create(
        organization=organization, code="OWN-2026", name="Ownership Term",
        starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.ACTIVE,
    )
    plan = AcademicStudyPlan.objects.create(organization=organization, membership=membership, term=term)
    client = APIClient()
    client.force_authenticate(user=other)
    response = client.get(f"/api/v1/organizations/{organization.id}/academic/study-plans/{plan.id}/")
    assert response.status_code == 404
