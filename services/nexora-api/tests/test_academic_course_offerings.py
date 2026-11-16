import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.academic.models import (
    AcademicClassroom,
    AcademicCourse,
    AcademicCourseOffering,
    AcademicProgram,
    AcademicTerm,
)
from apps.academic.offering_api import AcademicCourseOfferingListCreateView
from apps.identity.models import NexoraUser
from apps.organizations.services import OrganizationService


@pytest.mark.django_db
def test_course_offering_rejects_course_from_another_organization():
    owner = NexoraUser.objects.create(email="offering-owner@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Offering School", created_by=owner)
    other_owner = NexoraUser.objects.create(email="offering-other@school.test", status=NexoraUser.Status.ACTIVE)
    other = OrganizationService.create_organization(name="Other Offering School", created_by=other_owner)
    program = AcademicProgram.objects.create(organization=organization, code="ENG", name="Engineering")
    term = AcademicTerm.objects.create(
        organization=organization, code="2026-1", name="Term 1",
        starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="ENG-A", name="Engineering A", status=AcademicClassroom.Status.OPEN,
    )
    foreign_course = AcademicCourse.objects.create(
        organization=other, code="PHY101", name="Physics", credit_units=3,
    )
    offering = AcademicCourseOffering(
        organization=organization, classroom=classroom, course=foreign_course, code="PHY101-A",
    )
    with pytest.raises(ValidationError):
        offering.full_clean()


@pytest.mark.django_db
def test_course_offering_api_requires_manage_permission_for_creation():
    user = NexoraUser.objects.create(email="offering-member@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Offering API School", created_by=user)
    request = APIRequestFactory().post(
        f"/organizations/{organization.id}/academic/offerings/",
        {"code": "BIO-A", "classroom": "00000000-0000-0000-0000-000000000001",
         "course": "00000000-0000-0000-0000-000000000002"},
        format="json",
    )
    force_authenticate(request, user=user)
    response = AcademicCourseOfferingListCreateView.as_view()(request, organization_id=organization.id)
    assert response.status_code in (403, 404)
