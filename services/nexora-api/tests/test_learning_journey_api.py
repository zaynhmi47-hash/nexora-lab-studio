import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicCourse, AcademicCourseCompletion, AcademicCourseOutcomeMapping
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService
from apps.growth.models import GrowthMilestone
from apps.growth.services import GrowthMilestoneService, GrowthService
from apps.identity.models import NexoraUser
from apps.learning.models import LearningCompetency, LearningEvidence, LearningOutcome


def make_outcome(key):
    competency = LearningCompetency.objects.create(
        key=f"{key}-competency",
        title="Communication",
        domain="skills",
        is_published=True,
    )
    return LearningOutcome.objects.create(
        key=key,
        competency=competency,
        title="Communicate clearly",
        is_published=True,
    )


@pytest.mark.django_db
def test_development_journey_combines_learning_and_growth_with_provenance():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-owner@example.com",
    )
    outcome = make_outcome("journey-communication")
    LearningEvidence.objects.create(
        user=user,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.LEARNING_ACTIVITY,
        title="Completed communication lesson",
        source_type=LearningEvidence.SourceType.LEARNING,
        source_reference="lesson_completion:123:outcome:456",
    )
    goal = GrowthService.create_goal(user=user, title="Practice public speaking", start_date=timezone.localdate())
    milestone = GrowthMilestone.objects.create(
        user=user,
        title="Deliver a short presentation",
        pillar=GrowthMilestone.Pillar.SKILLS,
    )
    event = user.growth_evidence_events.get(subject_id=str(goal.id))
    GrowthMilestoneService.link_evidence(
        user=user,
        milestone_id=milestone.id,
        evidence_event_id=event.id,
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/v1/learning/journey/?window=30&limit=100")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    learning = next(item for item in payload["items"] if item["kind"] == "evidence")
    growth = next(item for item in payload["items"] if item["domain"] == "growth")
    assert learning["competency"]["key"] == outcome.competency.key
    assert learning["source"]["type"] == LearningEvidence.SourceType.LEARNING
    assert growth["description"] == goal.title
    assert growth["relatedMilestones"][0]["id"] == str(milestone.id)
    assert payload["privacy"]["ownerScoped"] is True
    assert payload["privacy"]["organizationAccessGranted"] is False
    assert payload["privacy"]["journalContentIncluded"] is False


@pytest.mark.django_db
def test_development_journey_is_private_to_authenticated_owner():
    owner = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-private-owner@example.com",
    )
    other = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-private-other@example.com",
    )
    outcome = make_outcome("journey-private-outcome")
    LearningEvidence.objects.create(
        user=other,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PROJECT,
        title="Other person's private project",
    )
    GrowthService.create_goal(user=other, title="Other person's private goal", start_date=timezone.localdate())

    client = APIClient()
    client.force_authenticate(user=owner)
    response = client.get("/api/v1/learning/journey/")

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("?window=14", 400),
        ("?window=30&limit=0", 400),
        ("?window=30&limit=101", 400),
        ("?window=30&offset=-1", 400),
        ("?window=not-a-number", 400),
    ],
)
def test_development_journey_rejects_invalid_window_and_limit(query, expected):
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email=f"journey-invalid-{abs(hash(query))}@example.com",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/journey/{query}")

    assert response.status_code == expected


@pytest.mark.django_db
def test_development_journey_requires_authentication():
    response = APIClient().get("/api/v1/learning/journey/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_development_journey_paginates_without_repeating_items():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-pagination@example.com",
    )
    for index in range(3):
        outcome = make_outcome(f"journey-pagination-{index}")
        LearningEvidence.objects.create(
            user=user,
            outcome=outcome,
            evidence_type=LearningEvidence.EvidenceType.PROJECT,
            title=f"Evidence {index}",
        )

    client = APIClient()
    client.force_authenticate(user=user)
    first = client.get("/api/v1/learning/journey/?limit=2&offset=0")
    second = client.get("/api/v1/learning/journey/?limit=2&offset=2")

    assert first.status_code == 200
    assert second.status_code == 200
    first_payload = first.json()
    second_payload = second.json()
    assert len(first_payload["items"]) == 2
    assert first_payload["hasMore"] is True
    assert first_payload["nextOffset"] == 2
    assert second_payload["offset"] == 2
    assert len(second_payload["items"]) == 1
    assert second_payload["hasMore"] is False
    assert second_payload["nextOffset"] is None
    assert not {
        item["id"] for item in first_payload["items"]
    }.intersection({item["id"] for item in second_payload["items"]})


@pytest.mark.django_db
def test_development_journey_includes_only_verified_academic_completion_and_mapping():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-academic-owner@example.com",
    )
    organization = OrganizationService.create_organization(
        name="Journey Academic School",
        created_by=user,
    )
    membership = Membership.objects.get(organization=organization, user=user)
    course = AcademicCourse.objects.create(
        organization=organization,
        code="COMM101",
        name="Communication Foundations",
        credit_units=3,
    )
    outcome = make_outcome("journey-academic-communication")
    AcademicCourseOutcomeMapping.objects.create(
        course=course,
        outcome=outcome,
        contribution_type=AcademicCourseOutcomeMapping.ContributionType.ASSESSED,
    )
    verified = AcademicCourseCompletion(
        organization=organization,
        membership=membership,
        course=course,
        status=AcademicCourseCompletion.Status.VERIFIED,
        completed_at=timezone.now(),
        verified_at=timezone.now(),
        verified_by=user,
        evidence_reference="transcript:COMM101",
    )
    verified.full_clean()
    verified.save()
    pending = AcademicCourseCompletion.objects.create(
        organization=organization,
        membership=membership,
        course=course,
        status=AcademicCourseCompletion.Status.PENDING,
        evidence_reference="pending:COMM101",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/v1/learning/journey/?window=30")

    assert response.status_code == 200
    academic = [item for item in response.json()["items"] if item["domain"] == "academic"]
    assert len(academic) == 1
    assert academic[0]["kind"] == "verified_course_completion"
    assert academic[0]["status"] == "verified"
    assert academic[0]["competency"]["key"] == outcome.competency.key
    assert academic[0]["source"]["reference"] == "transcript:COMM101"
    assert academic[0]["source"]["contributionType"] == "assessed"
    assert academic[0]["mastery"] is None
    assert "score" not in academic[0]
    assert pending.status == AcademicCourseCompletion.Status.PENDING


@pytest.mark.django_db
def test_development_journey_keeps_unmapped_verified_academic_completion_visible():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-academic-unmapped@example.com",
    )
    organization = OrganizationService.create_organization(
        name="Unmapped Academic School",
        created_by=user,
    )
    membership = Membership.objects.get(organization=organization, user=user)
    course = AcademicCourse.objects.create(
        organization=organization,
        code="HIST101",
        name="History Foundations",
        credit_units=2,
    )
    completion = AcademicCourseCompletion(
        organization=organization,
        membership=membership,
        course=course,
        status=AcademicCourseCompletion.Status.VERIFIED,
        completed_at=timezone.now(),
        verified_at=timezone.now(),
        verified_by=user,
    )
    completion.full_clean()
    completion.save()

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/v1/learning/journey/")

    academic = [item for item in response.json()["items"] if item["domain"] == "academic"]
    assert len(academic) == 1
    assert academic[0]["competency"] is None
    assert academic[0]["status"] == "verified"


@pytest.mark.django_db
def test_development_journey_includes_career_records_as_self_reported_only():
    from apps.career.models import CareerExperience, CareerProject

    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-career-owner@example.com",
    )
    CareerExperience.objects.create(
        user=user,
        role_title="Product Designer",
        organization_name="Independent Studio",
        employment_type=CareerExperience.EmploymentType.FREELANCE,
        start_date="2025-01-01",
        is_current=True,
    )
    CareerProject.objects.create(
        user=user,
        title="Community Learning Platform",
        summary="Designed a learning experience.",
        skills=["Product design", "Research"],
        visibility=CareerProject.Visibility.PRIVATE,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/learning/journey/?window=30")

    assert response.status_code == 200
    payload = response.json()
    career = [item for item in payload["items"] if item["domain"] == "career"]
    assert len(career) == 2
    assert {item["kind"] for item in career} == {"professional_experience", "portfolio_project"}
    assert all(item["status"] == "self_reported" for item in career)
    assert all(item["mastery"] is None and item["competency"] is None for item in career)
    assert payload["privacy"]["careerRecordsIncluded"] is True
    assert payload["privacy"]["careerRecordsShared"] is False
    assert payload["privacy"]["organizationAccessGranted"] is False


@pytest.mark.django_db
def test_development_journey_includes_research_records_without_private_research_content():
    from apps.research.models import ResearchOutput, ResearchProject

    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="journey-research-owner@example.com",
    )
    project = ResearchProject.objects.create(
        owner=user,
        title="Community learning access",
        abstract="Sensitive full abstract must not enter the timeline.",
        research_question="Private research question",
        field_of_study="Education",
        methodology="Qualitative",
    )
    ResearchOutput.objects.create(
        project=project,
        title="Field research report",
        output_type=ResearchOutput.OutputType.REPORT,
        status=ResearchOutput.Status.DRAFT,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/learning/journey/?window=30")

    assert response.status_code == 200
    payload = response.json()
    research = [item for item in payload["items"] if item["domain"] == "research"]
    assert len(research) == 2
    assert {item["kind"] for item in research} == {"research_project", "research_output"}
    assert all(item["status"] == "self_reported" for item in research)
    assert all(item["mastery"] is None for item in research)
    assert payload["privacy"]["researchRecordsIncluded"] is True
    assert payload["privacy"]["researchRecordsShared"] is False
    assert payload["privacy"]["organizationAccessGranted"] is False
    serialized = str(research)
    assert "Sensitive full abstract" not in serialized
    assert "Private research question" not in serialized
