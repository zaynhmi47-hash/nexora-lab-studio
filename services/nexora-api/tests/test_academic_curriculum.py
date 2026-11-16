import pytest
from django.core.exceptions import ValidationError

from apps.academic.models import AcademicCourse, AcademicCurriculumCourse, AcademicProgram
from apps.identity.models import NexoraUser
from apps.organizations.services import OrganizationService


@pytest.mark.django_db
def test_curriculum_course_requires_course_and_program_from_same_organization():
    owner = NexoraUser.objects.create(email="curriculum-owner@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Curriculum School", created_by=owner)
    other_owner = NexoraUser.objects.create(email="curriculum-other@school.test", status=NexoraUser.Status.ACTIVE)
    other_organization = OrganizationService.create_organization(name="Other Curriculum School", created_by=other_owner)

    program = AcademicProgram.objects.create(organization=organization, code="CS", name="Computer Science")
    foreign_course = AcademicCourse.objects.create(
        organization=other_organization, code="MATH101", name="Calculus", credit_units=3,
    )
    entry = AcademicCurriculumCourse(
        organization=organization,
        program=program,
        course=foreign_course,
        curriculum_version="2026",
        recommended_term=1,
        credit_units=3,
    )

    with pytest.raises(ValidationError):
        entry.full_clean()


@pytest.mark.django_db
def test_curriculum_course_maps_course_to_program_with_credit_override():
    owner = NexoraUser.objects.create(email="curriculum-map@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Curriculum Map School", created_by=owner)
    program = AcademicProgram.objects.create(organization=organization, code="IT", name="Information Technology")
    course = AcademicCourse.objects.create(
        organization=organization, code="DB101", name="Database Fundamentals", credit_units=4,
    )
    entry = AcademicCurriculumCourse.objects.create(
        organization=organization,
        program=program,
        course=course,
        curriculum_version="2026",
        recommended_term=2,
        credit_units=3,
        requirement=AcademicCurriculumCourse.Requirement.REQUIRED,
    )

    assert entry.credit_units == 3
    assert entry.course.credit_units == 4
    assert entry.program_id == program.id
