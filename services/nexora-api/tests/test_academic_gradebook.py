from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.academic.gradebook_services import AcademicGradebookService
from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicClassroom,
    AcademicCourse,
    AcademicCourseCompletion,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicFinalGrade,
    AcademicProgram,
    AcademicTerm,
)
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.fixture
def gradebook_context():
    instructor = NexoraUser.objects.create(
        email="gradebook-instructor@school.test", status=NexoraUser.Status.ACTIVE,
    )
    student = NexoraUser.objects.create(
        email="gradebook-student@school.test", status=NexoraUser.Status.ACTIVE,
    )
    organization = OrganizationService.create_organization(
        name="Gradebook School", created_by=instructor,
    )
    instructor_membership = Membership.objects.get(organization=organization, user=instructor)
    student_membership = Membership.objects.create(
        organization=organization, user=student, status=Membership.Status.ACTIVE,
    )
    program = AcademicProgram.objects.create(
        organization=organization, code="GB", name="Gradebook Program",
    )
    term = AcademicTerm.objects.create(
        organization=organization, code="GB-2026", name="Gradebook Term",
        starts_on="2026-01-01", ends_on="2026-12-31", status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="GB-A", name="Gradebook Class", status=AcademicClassroom.Status.OPEN,
    )
    course = AcademicCourse.objects.create(
        organization=organization, code="GB101", name="Gradebook Basics", credit_units=3,
    )
    offering = AcademicCourseOffering.objects.create(
        organization=organization, classroom=classroom, course=course,
        code="GB101-A", status=AcademicCourseOffering.Status.OPEN,
    )
    AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=term,
        membership=instructor_membership, role=AcademicEnrollment.Role.INSTRUCTOR,
        status=AcademicEnrollment.Status.ACTIVE,
    )
    AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=term,
        membership=student_membership, role=AcademicEnrollment.Role.STUDENT,
        status=AcademicEnrollment.Status.ACTIVE,
    )
    return {
        "instructor": instructor, "student": student, "organization": organization,
        "student_membership": student_membership, "offering": offering, "course": course,
    }


@pytest.mark.django_db
def test_final_grade_uses_weighted_components_and_verifies_prerequisite_evidence(gradebook_context):
    ctx = gradebook_context
    org, offering = ctx["organization"], ctx["offering"]
    AcademicGradebookService.configure_policy(
        organization=org, offering=offering, max_score=Decimal("100"),
        passing_score=Decimal("70"),
    )
    exam = AcademicGradebookService.create_component(
        organization=org, offering=offering, name="Exam", weight_percent=Decimal("60"),
    )
    project = AcademicGradebookService.create_component(
        organization=org, offering=offering, name="Project", weight_percent=Decimal("40"),
    )
    for component, score in ((exam, "80"), (project, "90")):
        entry = AcademicGradebookService.record_grade(
            organization=org, offering=offering, component=component,
            membership=ctx["student_membership"], score=Decimal(score),
            graded_by=ctx["instructor"],
        )
        AcademicGradebookService.publish_component_grade(entry=entry, published_by=ctx["instructor"])

    grade = AcademicGradebookService.publish_final_grade(
        organization=org, offering=offering, membership=ctx["student_membership"],
        published_by=ctx["instructor"],
    )

    assert grade.final_score == Decimal("84.00")
    assert grade.outcome == AcademicFinalGrade.Outcome.PASSED
    completion = AcademicCourseCompletion.objects.get(
        organization=org, membership=ctx["student_membership"], course=ctx["course"],
    )
    assert completion.status == AcademicCourseCompletion.Status.VERIFIED
    assert completion.verified_by == ctx["instructor"]


@pytest.mark.django_db
def test_final_grade_requires_exactly_one_hundred_percent_weights(gradebook_context):
    ctx = gradebook_context
    AcademicGradebookService.configure_policy(
        organization=ctx["organization"], offering=ctx["offering"],
        passing_score=Decimal("60"),
    )
    AcademicGradebookService.create_component(
        organization=ctx["organization"], offering=ctx["offering"],
        name="Exam", weight_percent=Decimal("80"),
    )
    with pytest.raises(ValidationError, match="100 percent"):
        AcademicGradebookService.calculate_final_score(
            organization=ctx["organization"], offering=ctx["offering"],
            membership=ctx["student_membership"],
        )


@pytest.mark.django_db
def test_grade_entry_requires_classroom_assigned_instructor(gradebook_context):
    ctx = gradebook_context
    outsider = NexoraUser.objects.create(
        email="gradebook-outsider@school.test", status=NexoraUser.Status.ACTIVE,
    )
    Membership.objects.create(
        organization=ctx["organization"], user=outsider, status=Membership.Status.ACTIVE,
    )
    component = AcademicGradebookService.create_component(
        organization=ctx["organization"], offering=ctx["offering"],
        name="Quiz", weight_percent=Decimal("100"),
    )
    with pytest.raises(ValidationError, match="assigned"):
        AcademicGradebookService.record_grade(
            organization=ctx["organization"], offering=ctx["offering"],
            component=component, membership=ctx["student_membership"],
            score=Decimal("90"), graded_by=outsider,
        )


@pytest.mark.django_db
def test_revision_reconciles_only_its_own_prerequisite_evidence(gradebook_context):
    ctx = gradebook_context
    org, offering = ctx["organization"], ctx["offering"]
    AcademicGradebookService.configure_policy(
        organization=org, offering=offering, max_score=Decimal("100"),
        passing_score=Decimal("70"),
    )
    component = AcademicGradebookService.create_component(
        organization=org, offering=offering, name="Final Exam",
        weight_percent=Decimal("100"),
    )
    entry = AcademicGradebookService.record_grade(
        organization=org, offering=offering, component=component,
        membership=ctx["student_membership"], score=Decimal("85"),
        graded_by=ctx["instructor"],
    )
    AcademicGradebookService.publish_component_grade(
        entry=entry, published_by=ctx["instructor"],
    )
    grade = AcademicGradebookService.publish_final_grade(
        organization=org, offering=offering, membership=ctx["student_membership"],
        published_by=ctx["instructor"],
    )
    evidence = AcademicCourseCompletion.objects.get(
        organization=org, membership=ctx["student_membership"],
        course=ctx["course"], evidence_reference=f"gradebook:final-grade:{grade.pk}",
    )

    revised = AcademicGradebookService.revise_final_grade(
        grade=grade, new_score=Decimal("50"), changed_by=ctx["instructor"],
        reason="Correction after assessment moderation",
    )

    evidence.refresh_from_db()
    assert revised.outcome == AcademicFinalGrade.Outcome.FAILED
    assert evidence.status == AcademicCourseCompletion.Status.REJECTED
    assert evidence.verified_at is None
    assert evidence.verified_by is None


@pytest.mark.django_db
def test_published_grade_and_revision_keep_original_grading_policy_version(gradebook_context):
    ctx = gradebook_context
    organization, offering = ctx["organization"], ctx["offering"]
    original_policy = AcademicGradebookService.configure_policy(
        organization=organization, offering=offering,
        max_score=Decimal("100"), passing_score=Decimal("70"),
    )
    component = AcademicGradebookService.create_component(
        organization=organization, offering=offering,
        name="Final Exam", weight_percent=Decimal("100"),
    )
    entry = AcademicGradebookService.record_grade(
        organization=organization, offering=offering, component=component,
        membership=ctx["student_membership"], score=Decimal("80"),
        graded_by=ctx["instructor"],
    )
    AcademicGradebookService.publish_component_grade(entry=entry, published_by=ctx["instructor"])
    grade = AcademicGradebookService.publish_final_grade(
        organization=organization, offering=offering,
        membership=ctx["student_membership"], published_by=ctx["instructor"],
    )
    assert grade.grading_policy_id == original_policy.pk

    replacement_policy = AcademicGradebookService.configure_policy(
        organization=organization, offering=offering,
        max_score=Decimal("200"), passing_score=Decimal("150"),
    )
    assert replacement_policy.pk != original_policy.pk

    revised = AcademicGradebookService.revise_final_grade(
        grade=grade, new_score=Decimal("75"), changed_by=ctx["instructor"],
        reason="Moderation correction under the original grading rules",
    )

    assert revised.grading_policy_id == original_policy.pk
    assert revised.outcome == AcademicFinalGrade.Outcome.PASSED
    assert revised.final_score == Decimal("75")
