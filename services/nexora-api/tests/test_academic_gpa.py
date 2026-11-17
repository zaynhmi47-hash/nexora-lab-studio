from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.academic.gpa_services import AcademicGpaService
from apps.academic.transcript_services import AcademicTranscriptService
from apps.academic.gradebook_services import AcademicGradebookService
from apps.academic.grading_scale_services import AcademicGradingScaleService
from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicClassroom,
    AcademicCourse,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicFinalGrade,
    AcademicGpaPolicy,
    AcademicTranscript,
    AcademicProgram,
    AcademicTerm,
)
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.fixture
def gpa_context():
    instructor = NexoraUser.objects.create(
        email="gpa-instructor@school.test", status=NexoraUser.Status.ACTIVE,
    )
    student = NexoraUser.objects.create(
        email="gpa-student@school.test", status=NexoraUser.Status.ACTIVE,
    )
    organization = OrganizationService.create_organization(
        name="GPA School", created_by=instructor,
    )
    instructor_membership = Membership.objects.get(organization=organization, user=instructor)
    student_membership = Membership.objects.create(
        organization=organization, user=student, status=Membership.Status.ACTIVE,
    )
    program = AcademicProgram.objects.create(
        organization=organization, code="GPA", name="GPA Program",
    )
    term = AcademicTerm.objects.create(
        organization=organization, code="GPA-2026", name="GPA Term",
        starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="GPA-A", name="GPA Class", status=AcademicClassroom.Status.OPEN,
    )
    course = AcademicCourse.objects.create(
        organization=organization, code="GPA101", name="GPA Fundamentals", credit_units=3,
    )
    offering = AcademicCourseOffering.objects.create(
        organization=organization, classroom=classroom, course=course,
        code="GPA101-A", status=AcademicCourseOffering.Status.OPEN,
    )
    for membership, role in (
        (instructor_membership, AcademicEnrollment.Role.INSTRUCTOR),
        (student_membership, AcademicEnrollment.Role.STUDENT),
    ):
        AcademicEnrollment.objects.create(
            organization=organization, classroom=classroom, term=term,
            membership=membership, role=role, status=AcademicEnrollment.Status.ACTIVE,
        )
    return {
        "instructor": instructor, "student": student, "organization": organization,
        "student_membership": student_membership, "offering": offering,
        "course": course, "term": term,
    }


def _publish_final_grade(ctx, score):
    offering = ctx["offering"]
    org = ctx["organization"]
    AcademicGradebookService.configure_policy(
        organization=org, offering=offering,
        max_score=Decimal("100"), passing_score=Decimal("60"),
    )
    component = AcademicGradebookService.create_component(
        organization=org, offering=offering,
        name="Final Exam", weight_percent=Decimal("100"),
    )
    entry = AcademicGradebookService.record_grade(
        organization=org, offering=offering, component=component,
        membership=ctx["student_membership"], score=Decimal(score),
        graded_by=ctx["instructor"],
    )
    AcademicGradebookService.publish_component_grade(
        entry=entry, published_by=ctx["instructor"],
    )
    return AcademicGradebookService.publish_final_grade(
        organization=org, offering=offering,
        membership=ctx["student_membership"], published_by=ctx["instructor"],
    )


def _publish_scale(organization):
    return AcademicGradingScaleService.publish_scale(
        organization=organization,
        name="Standard GPA Scale",
        maximum_grade_point=Decimal("4"),
        bands=[
            {"minimum_percentage": Decimal("0"), "maximum_percentage": Decimal("60"),
             "letter_grade": "F", "grade_points": Decimal("0"), "is_passing": False},
            {"minimum_percentage": Decimal("60"), "maximum_percentage": Decimal("75"),
             "letter_grade": "C", "grade_points": Decimal("2"), "is_passing": True},
            {"minimum_percentage": Decimal("75"), "maximum_percentage": Decimal("90"),
             "letter_grade": "B", "grade_points": Decimal("3"), "is_passing": True},
            {"minimum_percentage": Decimal("90"), "maximum_percentage": Decimal("100"),
             "letter_grade": "A", "grade_points": Decimal("4"), "is_passing": True},
        ],
    )


@pytest.mark.django_db
def test_gpa_calculation_uses_published_grade_and_credit_provenance(gpa_context):
    ctx = gpa_context
    grade = _publish_final_grade(ctx, "82")
    assert grade.credit_units_snapshot == 3
    assert grade.course_code_snapshot == "GPA101"

    scale = _publish_scale(ctx["organization"])
    policy = AcademicGpaService.publish_policy(
        organization=ctx["organization"],
        grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
        include_failed_grades=True,
    )
    calculation = AcademicGpaService.calculate(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        term=ctx["term"],
        calculated_by=ctx["student"],
    )

    assert calculation.policy_id == policy.pk
    assert calculation.term_gpa == Decimal("3.000")
    assert calculation.cumulative_gpa == Decimal("3.000")
    assert calculation.term_attempted_credits == 3
    assert calculation.term_earned_credits == 3
    assert calculation.details["grading_scale_version"] == scale.version
    assert calculation.details["term"][0]["course_code"] == "GPA101"


@pytest.mark.django_db
def test_gpa_policy_is_versioned_and_keeps_prior_calculation_provenance(gpa_context):
    ctx = gpa_context
    _publish_final_grade(ctx, "95")
    scale = _publish_scale(ctx["organization"])
    first = AcademicGpaService.publish_policy(
        organization=ctx["organization"], grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.FIRST,
        include_failed_grades=True,
    )
    calculation = AcademicGpaService.calculate(
        organization=ctx["organization"], membership=ctx["student_membership"],
        term=ctx["term"], calculated_by=ctx["student"],
    )
    second = AcademicGpaService.publish_policy(
        organization=ctx["organization"], grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.LATEST,
        include_failed_grades=False,
    )

    assert first.version == 1
    assert second.version == 2
    assert calculation.policy_id == first.pk
    assert calculation.details["retake_strategy"] == AcademicGpaPolicy.RetakeStrategy.FIRST
    assert calculation.policy.version == 1
    calculation.term_gpa = Decimal("1.000")
    with pytest.raises(RuntimeError, match="immutable"):
        calculation.save()


@pytest.mark.django_db
def test_gpa_policy_rejects_grading_scale_from_another_organization(gpa_context):
    ctx = gpa_context
    other = OrganizationService.create_organization(
        name="Other GPA School", created_by=ctx["instructor"],
    )
    other_scale = _publish_scale(other)
    with pytest.raises(ValidationError, match="another organization"):
        AcademicGpaService.publish_policy(
            organization=ctx["organization"],
            grading_scale=other_scale,
            retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
            include_failed_grades=True,
        )


@pytest.mark.django_db
def test_gpa_calculation_rejects_grade_without_credit_snapshot(gpa_context):
    ctx = gpa_context
    grade = _publish_final_grade(ctx, "82")
    grade.credit_units_snapshot = None
    grade.save(update_fields=("credit_units_snapshot",))
    scale = _publish_scale(ctx["organization"])
    AcademicGpaService.publish_policy(
        organization=ctx["organization"], grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
        include_failed_grades=True,
    )

    with pytest.raises(ValidationError, match="credit snapshot"):
        AcademicGpaService.calculate(
            organization=ctx["organization"], membership=ctx["student_membership"],
            term=ctx["term"], calculated_by=ctx["student"],
        )



@pytest.mark.django_db
def test_transcript_issuance_creates_verifiable_immutable_snapshot(gpa_context):
    ctx = gpa_context
    grade = _publish_final_grade(ctx, "82")
    scale = _publish_scale(ctx["organization"])
    AcademicGpaService.publish_policy(
        organization=ctx["organization"],
        grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
        include_failed_grades=True,
    )
    AcademicGpaService.calculate(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        term=ctx["term"],
        calculated_by=ctx["student"],
    )

    transcript = AcademicTranscriptService.issue(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        program=grade.offering.classroom.program,
        through_term=ctx["term"],
        issued_by=ctx["instructor"],
    )

    assert transcript.status == AcademicTranscript.Status.ISSUED
    assert transcript.snapshot["student"]["display_name"] == ctx["student"].display_name
    assert transcript.snapshot["terms"][0]["grades"][0]["course_code"] == "GPA101"
    assert transcript.snapshot["terms"][0]["term_gpa"] == "3.000"
    assert transcript.snapshot["summary"]["cumulative_earned_credits"] == 3
    assert AcademicTranscriptService.verify(transcript) is True

    transcript.snapshot["student"]["display_name"] = "Tampered"
    with pytest.raises(RuntimeError, match="immutable"):
        transcript.save()


@pytest.mark.django_db
def test_transcript_requires_fresh_gpa_calculation(gpa_context):
    ctx = gpa_context
    grade = _publish_final_grade(ctx, "82")
    scale = _publish_scale(ctx["organization"])
    AcademicGpaService.publish_policy(
        organization=ctx["organization"],
        grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
        include_failed_grades=True,
    )
    AcademicGpaService.calculate(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        term=ctx["term"],
        calculated_by=ctx["student"],
    )
    grade.updated_at = timezone.now()
    grade.save(update_fields=("updated_at",))

    with pytest.raises(ValidationError, match="stale"):
        AcademicTranscriptService.issue(
            organization=ctx["organization"],
            membership=ctx["student_membership"],
            program=grade.offering.classroom.program,
            through_term=ctx["term"],
            issued_by=ctx["instructor"],
        )


@pytest.mark.django_db
def test_transcript_revocation_preserves_original_checksum(gpa_context):
    ctx = gpa_context
    grade = _publish_final_grade(ctx, "82")
    scale = _publish_scale(ctx["organization"])
    AcademicGpaService.publish_policy(
        organization=ctx["organization"],
        grading_scale=scale,
        retake_strategy=AcademicGpaPolicy.RetakeStrategy.HIGHEST,
        include_failed_grades=True,
    )
    AcademicGpaService.calculate(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        term=ctx["term"],
        calculated_by=ctx["student"],
    )
    transcript = AcademicTranscriptService.issue(
        organization=ctx["organization"],
        membership=ctx["student_membership"],
        program=grade.offering.classroom.program,
        through_term=ctx["term"],
        issued_by=ctx["instructor"],
    )
    original_checksum = transcript.snapshot_checksum

    revoked = AcademicTranscriptService.revoke(
        transcript=transcript,
        revoked_by=ctx["instructor"],
        reason="Issued against an incorrect student request.",
    )

    assert revoked.status == AcademicTranscript.Status.REVOKED
    assert revoked.snapshot_checksum == original_checksum
    assert AcademicTranscriptService.verify(revoked) is True
    with pytest.raises(RuntimeError, match="cannot be re-issued"):
        revoked.status = AcademicTranscript.Status.ISSUED
        revoked.revoked_at = None
        revoked.revoked_by = None
        revoked.revocation_reason = ""
        revoked.save()
