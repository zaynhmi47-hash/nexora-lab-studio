import pytest
from django.core.exceptions import ValidationError

from apps.academic.models import AcademicClassroom, AcademicCourse, AcademicCourseOffering, AcademicProgram, AcademicTerm
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
    foreign_course = AcademicCourse.objects.create(organization=other, code="PHY101", name="Physics", credit_units=3)
    offering = AcademicCourseOffering(
        organization=organization, classroom=classroom, course=foreign_course, code="PHY101-A",
    )
    with pytest.raises(ValidationError):
        offering.full_clean()


@pytest.mark.django_db
def test_course_offering_rejects_capacity_above_classroom_capacity():
    owner = NexoraUser.objects.create(email="offering-capacity@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Offering Capacity School", created_by=owner)
    program = AcademicProgram.objects.create(organization=organization, code="SCI", name="Science")
    term = AcademicTerm.objects.create(
        organization=organization, code="2026-2", name="Term 2",
        starts_on="2026-07-01", ends_on="2026-12-31", status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="SCI-A", name="Science A", capacity=25, status=AcademicClassroom.Status.OPEN,
    )
    course = AcademicCourse.objects.create(organization=organization, code="CHEM101", name="Chemistry", credit_units=3)
    offering = AcademicCourseOffering(
        organization=organization, classroom=classroom, course=course,
        code="CHEM101-A", capacity=30,
    )
    with pytest.raises(ValidationError):
        offering.full_clean()
