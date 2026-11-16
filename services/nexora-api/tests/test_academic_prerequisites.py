import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.academic.models import AcademicCourse, AcademicCourseCompletion
from apps.academic.rules.prerequisites import AcademicPrerequisiteService
from apps.identity.models import NexoraUser
from apps.organizations.services import OrganizationService


@pytest.fixture
def academic_context():
    owner = NexoraUser.objects.create(
        email="prerequisite-owner@school.test",
        status=NexoraUser.Status.ACTIVE,
    )
    organization = OrganizationService.create_organization(
        name="Prerequisite School",
        created_by=owner,
    )
    membership = organization.memberships.get(user=owner)
    prerequisite = AcademicCourse.objects.create(
        organization=organization,
        code="MATH100",
        name="Basic Mathematics",
        credit_units=3,
    )
    target = AcademicCourse.objects.create(
        organization=organization,
        code="MATH200",
        name="Advanced Mathematics",
        credit_units=3,
    )
    return owner, organization, membership, prerequisite, target


@pytest.mark.django_db
def test_prerequisite_evaluation_is_pending_without_verified_evidence(academic_context):
    _, organization, membership, prerequisite, target = academic_context
    AcademicPrerequisiteService.add_rule(
        organization=organization,
        course=target,
        prerequisite_course=prerequisite,
    )

    result = AcademicPrerequisiteService.evaluate(
        organization=organization,
        membership=membership,
        course=target,
    )

    assert result["eligible"] is False
    assert result["status"] == "pending_evidence"
    assert [item["course_code"] for item in result["missing_prerequisites"]] == ["MATH100"]


@pytest.mark.django_db
def test_verified_completion_satisfies_prerequisite(academic_context):
    owner, organization, membership, prerequisite, target = academic_context
    AcademicPrerequisiteService.add_rule(
        organization=organization,
        course=target,
        prerequisite_course=prerequisite,
    )
    completion = AcademicCourseCompletion(
        organization=organization,
        membership=membership,
        course=prerequisite,
        status=AcademicCourseCompletion.Status.VERIFIED,
        completed_at=timezone.now(),
        verified_at=timezone.now(),
        verified_by=owner,
        evidence_reference="legacy-transcript:MAT-100",
    )
    completion.full_clean()
    completion.save()

    result = AcademicPrerequisiteService.evaluate(
        organization=organization,
        membership=membership,
        course=target,
    )

    assert result["eligible"] is True
    assert result["status"] == "passed"
    assert result["missing_prerequisites"] == []


@pytest.mark.django_db
def test_prerequisite_service_rejects_dependency_cycles(academic_context):
    _, organization, _, prerequisite, target = academic_context
    AcademicPrerequisiteService.add_rule(
        organization=organization,
        course=target,
        prerequisite_course=prerequisite,
    )

    with pytest.raises(ValidationError, match="cycle"):
        AcademicPrerequisiteService.add_rule(
            organization=organization,
            course=prerequisite,
            prerequisite_course=target,
        )


@pytest.mark.django_db
def test_prerequisite_rule_rejects_cross_organization_course(academic_context):
    _, organization, _, _, target = academic_context
    foreign_owner = NexoraUser.objects.create(
        email="prerequisite-foreign@school.test",
        status=NexoraUser.Status.ACTIVE,
    )
    foreign_organization = OrganizationService.create_organization(
        name="Foreign Prerequisite School",
        created_by=foreign_owner,
    )
    foreign_course = AcademicCourse.objects.create(
        organization=foreign_organization,
        code="BIO100",
        name="Biology",
        credit_units=3,
    )

    with pytest.raises(ValidationError):
        AcademicPrerequisiteService.add_rule(
            organization=organization,
            course=target,
            prerequisite_course=foreign_course,
        )
