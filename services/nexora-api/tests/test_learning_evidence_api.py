import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.learning.models import (
    LearningCompetency,
    LearningEvidence,
    LearningMastery,
    LearningOutcome,
)


def create_learning_outcome(*, key="critical-thinking", published=True):
    competency = LearningCompetency.objects.create(
        key=f"{key}-competency",
        title="Critical Thinking",
        description="Evaluate information and reason carefully.",
        domain="intellectual",
        is_published=published,
    )
    outcome = LearningOutcome.objects.create(
        key=key,
        competency=competency,
        title="Evaluate a source",
        description="Assess credibility and supporting evidence.",
        success_criteria=["Identify author", "Check supporting evidence"],
        proficiency_level=2,
        is_published=published,
    )
    return competency, outcome


@pytest.mark.django_db
def test_competency_catalog_returns_only_published_taxonomy():
    competency, outcome = create_learning_outcome()
    create_learning_outcome(key="draft-outcome", published=False)
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="taxonomy-reader@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/learning/competencies/")

    assert response.status_code == 200
    assert response.json() == [
        {
            "key": competency.key,
            "title": competency.title,
            "description": competency.description,
            "domain": competency.domain,
            "parentKey": None,
            "outcomes": [
                {
                    "key": outcome.key,
                    "title": outcome.title,
                    "description": outcome.description,
                    "successCriteria": outcome.success_criteria,
                    "proficiencyLevel": 2,
                }
            ],
        }
    ]


@pytest.mark.django_db
def test_learner_can_submit_private_pending_evidence_but_cannot_self_verify():
    _, outcome = create_learning_outcome()
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="evidence-owner@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/v1/learning/evidence/",
        {
            "outcomeKey": outcome.key,
            "type": LearningEvidence.EvidenceType.PROJECT,
            "title": "Community research project",
            "description": "A short project with documented findings.",
            "artifactUrl": "https://portfolio.example.org/research",
            "status": LearningEvidence.Status.VERIFIED,
            "sourceType": LearningEvidence.SourceType.ACADEMIC,
        },
        format="json",
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == LearningEvidence.Status.PENDING
    assert payload["sourceType"] == LearningEvidence.SourceType.SELF_REPORTED
    assert payload["artifactUrl"] == "https://portfolio.example.org/research"
    evidence = LearningEvidence.objects.get(id=payload["id"])
    assert evidence.user_id == user.id
    assert evidence.verified_by is None
    assert evidence.verified_at is None


@pytest.mark.django_db
def test_evidence_portfolio_is_scoped_to_authenticated_owner():
    _, outcome = create_learning_outcome()
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="portfolio-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="portfolio-other@example.com")
    LearningEvidence.objects.create(
        user=owner,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PRACTICE,
        title="Owner evidence",
    )
    LearningEvidence.objects.create(
        user=other,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PRACTICE,
        title="Other user evidence",
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get("/api/v1/learning/evidence/")

    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Owner evidence"]


@pytest.mark.django_db
def test_skill_profile_does_not_infer_mastery_from_submitted_or_verified_evidence():
    _, outcome = create_learning_outcome()
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="skill-profile@example.com")
    reviewer = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="evidence-reviewer@example.com",
    )
    LearningEvidence.objects.create(
        user=user,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.CERTIFICATE,
        title="Certificate reviewed by an authorized reviewer",
        status=LearningEvidence.Status.VERIFIED,
        verified_by=reviewer,
        verified_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/learning/skills/")

    assert response.status_code == 200
    skill = response.json()[0]
    assert skill["masteryLevel"] is None
    assert skill["masteryStatus"] == LearningMastery.Status.UNASSESSED
    assert skill["evidenceCounts"] == {"pending": 0, "verified": 1, "rejected": 0}


@pytest.mark.django_db
def test_skill_profile_uses_explicit_mastery_record_not_course_progress():
    _, outcome = create_learning_outcome()
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="assessed-profile@example.com")
    LearningMastery.objects.create(
        user=user,
        outcome=outcome,
        level=3,
        status=LearningMastery.Status.PROVISIONAL,
        assessment_method="reviewed_portfolio",
        rationale="Evidence demonstrates independent application.",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/v1/learning/skills/")

    assert response.status_code == 200
    skill = response.json()[0]
    assert skill["masteryLevel"] == 3
    assert skill["masteryStatus"] == LearningMastery.Status.PROVISIONAL
    assert skill["assessmentMethod"] == "reviewed_portfolio"


@pytest.mark.django_db
def test_evidence_submission_rejects_unpublished_outcome_and_unsafe_url():
    _, outcome = create_learning_outcome()
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="evidence-validation@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    unsafe_url = client.post(
        "/api/v1/learning/evidence/",
        {
            "outcomeKey": outcome.key,
            "type": LearningEvidence.EvidenceType.PROJECT,
            "title": "Unsafe artifact",
            "artifactUrl": "javascript:alert(1)",
        },
        format="json",
    )
    assert unsafe_url.status_code == 400

    hidden = client.post(
        "/api/v1/learning/evidence/",
        {
            "outcomeKey": "draft-outcome",
            "type": LearningEvidence.EvidenceType.PROJECT,
            "title": "Hidden outcome evidence",
        },
        format="json",
    )
    assert hidden.status_code == 404


@pytest.mark.django_db
def test_learning_evidence_endpoints_require_authentication():
    client = APIClient()

    assert client.get("/api/v1/learning/competencies/").status_code == 401
    assert client.get("/api/v1/learning/evidence/").status_code == 401
    assert client.get("/api/v1/learning/skills/").status_code == 401
