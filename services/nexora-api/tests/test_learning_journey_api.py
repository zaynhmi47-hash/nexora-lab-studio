import pytest
from rest_framework.test import APIClient

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
    goal = GrowthService.create_goal(user=user, title="Practice public speaking")
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
    GrowthService.create_goal(user=other, title="Other person's private goal")

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
