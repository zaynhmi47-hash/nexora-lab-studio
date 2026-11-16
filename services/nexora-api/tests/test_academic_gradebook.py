from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.academic.gradebook_services import AcademicGradebookService
from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicClassroom,
    AcademicCourse,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicFinalGrade,
    AcademicGradeEntry,
    AcademicGradingPolicy,
    AcademicProgram,
    AcademicTerm,
)
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.fixture
def gradebook_context():
    owner = NexoraUser.objects.create(email="grade-owner@school.test", status=NexoraUser.Status.ACTIVE)
    teacher = NexoraUser.objects.create(email="grade-teacher@school.test", status=NexoraUser.Status.ACTIVE)
    student = NexoraUser.objects.create(email="grade-student@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Gradebook School", created_by=owner)
    teacher_membership = Membership.objects.get(organization=organization, user=teacher)
    student_membership = Membership.objects.get(organization=organization, user=student)
    program = AcademicProgram.objects.create(organization=organization, code="GRD", name="Grade Program")
    term = AcademicTerm.objects.create(
        organization=organization, code="GRD-2026", name="Grade Term",
        starts_on="2026-01-01", ends_on="2026-12-31", status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term, code="GRD-A",
        name="Grade Classroom", status=AcademicClassroom.Status.IN_PROGRESS,
    )
    course = AcademicCourse.objects.create(organization=organization, code="GRD101", name="Grade Fundamentals", credit_units=3)
    offering = AcademicCourseOffering.objects.create(
        organization=organization, classroom=classroom, course=course,
        code="GRD101-A", status=AcademicCourseOffering.Status.OPEN,
    )
    AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=term, membership=teacher_membership,
        role=AcademicEnrollment.Role.INSTRUCTOR, status=AcademicEnrollment.Status.ACTIVE,
    )
    AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=term, membership=student_membership,
        role=AcademicEnrollment.Role.STUDENT, status=AcademicEnrollment.Status.ACTIVE,
    )
    return locals()


@pytest.mark.django_db
def test_gradebook_requires_weights_to_total_100_before_activation(gradebook_context):
    ctx = gradebook_context
    policy = AcademicGradebookService.create_policy(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
    )
    AcademicGradebookService.add_component(
        actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        code="MID", name="Midterm", weight_percent=40, max_score=100,
    )
    with pytest.raises(ValidationError, match="total exactly 100"):
        AcademicGradebookService.activate_policy(
            actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        )


@pytest.mark.django_db
def test_gradebook_publishes_weighted_final_grade_and_verified_completion(gradebook_context):
    ctx = gradebook_context
    policy = AcademicGradebookService.create_policy(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        passing_score=Decimal("60"),
    )
    first = AcademicGradebookService.add_component(
        actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        code="MID", name="Midterm", weight_percent=40, max_score=100,
    )
    second = AcademicGradebookService.add_component(
        actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        code="FINAL", name="Final", weight_percent=60, max_score=100,
    )
    AcademicGradebookService.activate_policy(actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id)

    one = AcademicGradebookService.record_grade(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        component_id=first.id, membership_id=ctx["student_membership"].id, score=80,
    )
    result_one = AcademicGradebookService.publish_grade(
        actor=ctx["teacher"], organization=ctx["organization"], grade_entry_id=one.id,
    )
    assert result_one["status"] == "awaiting_components"
    assert result_one["final_grade"] is None

    two = AcademicGradebookService.record_grade(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        component_id=second.id, membership_id=ctx["student_membership"].id, score=90,
    )
    result_two = AcademicGradebookService.publish_grade(
        actor=ctx["teacher"], organization=ctx["organization"], grade_entry_id=two.id,
    )
    assert result_two["status"] == "published"
    assert result_two["final_grade"].weighted_score == Decimal("86.00")
    assert result_two["final_grade"].is_pass is True
    assert AcademicFinalGrade.objects.filter(membership=ctx["student_membership"]).count() == 1


@pytest.mark.django_db
def test_gradebook_rejects_scores_above_component_maximum(gradebook_context):
    ctx = gradebook_context
    policy = AcademicGradebookService.create_policy(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
    )
    component = AcademicGradebookService.add_component(
        actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        code="QUIZ", name="Quiz", weight_percent=100, max_score=20,
    )
    AcademicGradebookService.activate_policy(actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id)
    with pytest.raises(ValidationError, match="maximum"):
        AcademicGradebookService.record_grade(
            actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
            component_id=component.id, membership_id=ctx["student_membership"].id, score=21,
        )


@pytest.mark.django_db
def test_non_instructor_cannot_record_grades(gradebook_context):
    ctx = gradebook_context
    with pytest.raises(ValidationError, match="instructor enrollment"):
        AcademicGradebookService.create_policy(
            actor=ctx["student"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        )


@pytest.mark.django_db
def test_grade_entry_cannot_be_published_twice_and_revision_is_preserved(gradebook_context):
    ctx = gradebook_context
    policy = AcademicGradebookService.create_policy(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
    )
    component = AcademicGradebookService.add_component(
        actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id,
        code="FINAL", name="Final", weight_percent=100, max_score=100,
    )
    AcademicGradebookService.activate_policy(actor=ctx["teacher"], organization=ctx["organization"], policy_id=policy.id)
    first = AcademicGradebookService.record_grade(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        component_id=component.id, membership_id=ctx["student_membership"].id, score=70,
    )
    AcademicGradebookService.publish_grade(actor=ctx["teacher"], organization=ctx["organization"], grade_entry_id=first.id)
    with pytest.raises(ValidationError, match="Only draft"):
        AcademicGradebookService.publish_grade(actor=ctx["teacher"], organization=ctx["organization"], grade_entry_id=first.id)
    revision = AcademicGradebookService.record_grade(
        actor=ctx["teacher"], organization=ctx["organization"], offering_id=ctx["offering"].id,
        component_id=component.id, membership_id=ctx["student_membership"].id, score=75,
    )
    assert revision.revision == 2
    assert revision.supersedes_id == first.id
    assert first.score == Decimal("70.00")
