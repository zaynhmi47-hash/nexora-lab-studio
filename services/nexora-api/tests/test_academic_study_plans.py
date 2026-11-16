import pytest
from django.core.exceptions import ValidationError

from apps.academic.models import AcademicCourse, AcademicCourseOffering, AcademicProgram, AcademicTerm, AcademicStudyPlan, AcademicClassroom, AcademicEnrollment
from apps.academic.study_plan_services import AcademicStudyPlanService
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.mark.django_db
def test_study_plan_rejects_offering_from_another_term():
    owner = NexoraUser.objects.create(email="krs-owner@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="KRS School", created_by=owner)
    member = Membership.objects.filter(organization=organization, user=owner).first()
    program = AcademicProgram.objects.create(organization=organization, code="KRS", name="KRS Program")
    term1 = AcademicTerm.objects.create(organization=organization, code="2026-A", name="Term A", starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.ACTIVE)
    term2 = AcademicTerm.objects.create(organization=organization, code="2026-B", name="Term B", starts_on="2026-07-01", ends_on="2026-12-31", status=AcademicTerm.Status.ACTIVE)
    classroom = AcademicClassroom.objects.create(organization=organization, program=program, term=term2, code="KRS-B", name="KRS B", status=AcademicClassroom.Status.OPEN)
    course = AcademicCourse.objects.create(organization=organization, code="KRS101", name="KRS Basics", credit_units=3)
    offering = AcademicCourseOffering.objects.create(organization=organization, classroom=classroom, course=course, code="KRS101-B", status=AcademicCourseOffering.Status.OPEN)
    plan = AcademicStudyPlan.objects.create(organization=organization, membership=member, term=term1, max_credit_units=24)
    with pytest.raises(ValidationError):
        AcademicStudyPlanService.add_offering(plan_id=plan.id, organization=organization, offering_id=offering.id)


@pytest.mark.django_db
def test_study_plan_enforces_credit_limit():
    owner = NexoraUser.objects.create(email="krs-limit@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="KRS Limit School", created_by=owner)
    member = Membership.objects.filter(organization=organization, user=owner).first()
    program = AcademicProgram.objects.create(organization=organization, code="LIM", name="Limit Program")
    term = AcademicTerm.objects.create(organization=organization, code="2026-L", name="Limit Term", starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.ACTIVE)
    classroom = AcademicClassroom.objects.create(organization=organization, program=program, term=term, code="LIM-A", name="Limit A", status=AcademicClassroom.Status.OPEN)
    course = AcademicCourse.objects.create(organization=organization, code="LIM101", name="Limit Course", credit_units=4)
    offering = AcademicCourseOffering.objects.create(organization=organization, classroom=classroom, course=course, code="LIM101-A", status=AcademicCourseOffering.Status.OPEN)
    AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=term, membership=member,
        role=AcademicEnrollment.Role.STUDENT, status=AcademicEnrollment.Status.ACTIVE,
    )
    plan = AcademicStudyPlanService.create(organization=organization, membership=member, term=term, max_credit_units=3)
    with pytest.raises(ValidationError):
        AcademicStudyPlanService.add_offering(plan_id=plan.id, organization=organization, offering_id=offering.id)
