import pytest

from apps.academic.models import (
    AcademicCourse,
    AcademicCourseCompletion,
    AcademicCurriculumCourse,
    AcademicProgram,
    AcademicProgramEnrollment,
)
from apps.academic.progress_services import AcademicProgressService
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService
from django.utils import timezone


@pytest.fixture
def progress_context():
    actor = NexoraUser.objects.create(
        email="progress-admin@school.test", status=NexoraUser.Status.ACTIVE,
    )
    student = NexoraUser.objects.create(
        email="progress-student@school.test", status=NexoraUser.Status.ACTIVE,
    )
    organization = OrganizationService.create_organization(
        name="Progress School", created_by=actor,
    )
    membership = Membership.objects.create(
        organization=organization, user=student, status=Membership.Status.ACTIVE,
    )
    program = AcademicProgram.objects.create(
        organization=organization, code="PROG", name="Progress Program",
    )
    required_done = AcademicCourse.objects.create(
        organization=organization, code="REQ101", name="Required One", credit_units=3,
    )
    required_open = AcademicCourse.objects.create(
        organization=organization, code="REQ102", name="Required Two", credit_units=3,
    )
    elective = AcademicCourse.objects.create(
        organization=organization, code="ELC101", name="Elective One", credit_units=2,
    )
    for course, requirement, credits in (
        (required_done, AcademicCurriculumCourse.Requirement.REQUIRED, 3),
        (required_open, AcademicCurriculumCourse.Requirement.REQUIRED, 3),
        (elective, AcademicCurriculumCourse.Requirement.ELECTIVE, 2),
    ):
        AcademicCurriculumCourse.objects.create(
            organization=organization, program=program, course=course,
            curriculum_version="2026", recommended_term=1,
            credit_units=credits, requirement=requirement,
        )
    AcademicCourseCompletion.objects.create(
        organization=organization, membership=membership, course=required_done,
        status=AcademicCourseCompletion.Status.VERIFIED,
        completed_at=timezone.now(), verified_at=timezone.now(),
        verified_by=actor, evidence_reference="verified-import-001",
    )
    enrollment = AcademicProgramEnrollment.objects.create(
        organization=organization, membership=membership, program=program,
        curriculum_version="2026", enrolled_at="2026-01-01",
    )
    return {"actor": actor, "membership": membership, "enrollment": enrollment}


@pytest.mark.django_db
def test_progress_uses_explicit_curriculum_and_verified_completion(progress_context):
    result = AcademicProgressService.calculate(progress_context["enrollment"])

    assert result["progress"]["required_courses_total"] == 2
    assert result["progress"]["required_courses_completed"] == 1
    assert result["progress"]["required_courses_remaining"] == 1
    assert result["progress"]["required_credits_total"] == 6
    assert result["progress"]["required_credits_completed"] == 3
    assert result["progress"]["required_curriculum_percent"] == 50
    assert result["progress"]["elective_requirement"] == "not_configured"
    assert result["graduation_eligibility"] == "not_evaluable"
    assert "graduation_policy_not_configured" in result["graduation_blockers"]
    assert "required_courses_incomplete" in result["graduation_blockers"]


@pytest.mark.django_db
def test_progress_snapshot_is_versioned_and_checksum_verifiable(progress_context):
    enrollment = progress_context["enrollment"]
    first = AcademicProgressService.create_snapshot(
        enrollment=enrollment, generated_by=progress_context["actor"],
    )
    second = AcademicProgressService.create_snapshot(
        enrollment=enrollment, generated_by=progress_context["actor"],
    )

    assert first.version == 1
    assert second.version == 2
    assert AcademicProgressService.checksum(first.snapshot) == first.snapshot_checksum
    assert AcademicProgressService.checksum(second.snapshot) == second.snapshot_checksum
    first.snapshot["progress"]["required_curriculum_percent"] = 100
    with pytest.raises(RuntimeError, match="immutable"):
        first.save()


@pytest.mark.django_db
def test_progress_rejects_enrollment_for_inactive_membership(progress_context):
    enrollment = progress_context["enrollment"]
    enrollment.membership.status = Membership.Status.SUSPENDED
    enrollment.membership.save(update_fields=("status",))

    with pytest.raises(Exception, match="active organization membership"):
        AcademicProgressService.calculate(enrollment)
