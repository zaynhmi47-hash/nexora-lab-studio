import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.access.services import assign_role
from apps.identity.models import NexoraUser
from apps.organizations.services import MembershipService, OrganizationService
from apps.learning.models import (
    LearningCompetency,
    LearningEvidence,
    LearningMastery,
    LearningOutcome,
    LearningEvidenceShare,
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
    assert evidence.reviewed_by is None
    assert evidence.reviewed_at is None


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
        reviewed_by=reviewer,
        reviewed_at=timezone.now(),
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
    assessor = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="mastery-assessor@example.com",
    )
    LearningMastery.objects.create(
        user=user,
        outcome=outcome,
        level=3,
        status=LearningMastery.Status.PROVISIONAL,
        assessment_method="reviewed_portfolio",
        rationale="Evidence demonstrates independent application.",
        assessed_by=assessor,
        assessed_at=timezone.now(),
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


@pytest.mark.django_db
def test_evidence_is_private_until_learner_explicitly_shares_with_organization():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="sharing-learner@example.com")
    outsider = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="sharing-outsider@example.com")
    organization = OrganizationService.create_organization(name="Evidence Review Org", created_by=learner)
    _, outcome = create_learning_outcome(key="private-evidence")
    evidence = LearningEvidence.objects.create(
        user=learner,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PROJECT,
        title="Private project",
    )
    client = APIClient()
    client.force_authenticate(user=outsider)

    denied = client.get(f"/api/v1/learning/organizations/{organization.id}/evidence/review/")
    assert denied.status_code == 403
    assert LearningEvidenceShare.objects.count() == 0

    client.force_authenticate(user=learner)
    shared = client.post(
        "/api/v1/learning/evidence/shares/",
        {"evidenceId": str(evidence.id), "organizationId": str(organization.id)},
        format="json",
    )
    assert shared.status_code == 201
    assert LearningEvidenceShare.objects.filter(
        evidence=evidence,
        organization=organization,
        revoked_at__isnull=True,
    ).exists()


@pytest.mark.django_db
def test_only_authorized_organization_reviewer_can_review_explicitly_shared_evidence():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="review-learner@example.com")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="review-admin@example.com")
    organization = OrganizationService.create_organization(name="Authorized Review Org", created_by=learner)
    reviewer_membership = MembershipService.add_user(user=reviewer, organization_id=organization.id)
    assign_role(
        actor=learner,
        membership=reviewer_membership,
        role=organization.roles.get(slug="admin"),
    )
    _, outcome = create_learning_outcome(key="reviewable-evidence")
    evidence = LearningEvidence.objects.create(
        user=learner,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PRACTICE,
        title="Practical demonstration",
    )
    learner_client = APIClient()
    learner_client.force_authenticate(user=learner)
    share_response = learner_client.post(
        "/api/v1/learning/evidence/shares/",
        {"evidenceId": str(evidence.id), "organizationId": str(organization.id)},
        format="json",
    )
    assert share_response.status_code == 201

    reviewer_client = APIClient()
    reviewer_client.force_authenticate(user=reviewer)
    queue = reviewer_client.get(f"/api/v1/learning/organizations/{organization.id}/evidence/review/")
    assert queue.status_code == 200
    assert [item["evidenceId"] for item in queue.json()] == [str(evidence.id)]

    premature_assessment = reviewer_client.post(
        f"/api/v1/learning/organizations/{organization.id}/mastery/assess/",
        {
            "learnerId": str(learner.id),
            "outcomeKey": outcome.key,
            "level": 3,
            "status": LearningMastery.Status.PROVISIONAL,
            "assessmentMethod": "reviewed_portfolio",
            "rationale": "Attempt before evidence verification.",
        },
        format="json",
    )
    assert premature_assessment.status_code == 400

    reviewed = reviewer_client.post(
        f"/api/v1/learning/organizations/{organization.id}/evidence/{evidence.id}/review/",
        {"decision": "verified", "reviewNote": "Demonstration reviewed."},
        format="json",
    )
    assert reviewed.status_code == 200
    evidence.refresh_from_db()
    assert evidence.status == LearningEvidence.Status.VERIFIED
    assert evidence.reviewed_by_id == reviewer.id
    assert evidence.reviewed_at is not None
    assert evidence.review_note == "Demonstration reviewed."

    assessed = reviewer_client.post(
        f"/api/v1/learning/organizations/{organization.id}/mastery/assess/",
        {
            "learnerId": str(learner.id),
            "outcomeKey": outcome.key,
            "level": 3,
            "status": LearningMastery.Status.PROVISIONAL,
            "assessmentMethod": "reviewed_portfolio",
            "rationale": "Verified project evidence demonstrates independent application.",
        },
        format="json",
    )
    assert assessed.status_code == 200
    assert assessed.json()["level"] == 3
    assert assessed.json()["status"] == LearningMastery.Status.PROVISIONAL
    mastery = LearningMastery.objects.get(user=learner, outcome=outcome)
    assert mastery.assessed_by_id == reviewer.id
    assert mastery.assessed_at is not None


@pytest.mark.django_db
def test_learner_can_revoke_organization_access_to_evidence():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="revoke-learner@example.com")
    organization = OrganizationService.create_organization(name="Revocable Review Org", created_by=learner)
    _, outcome = create_learning_outcome(key="revocable-evidence")
    evidence = LearningEvidence.objects.create(
        user=learner,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.PROJECT,
        title="Shared then revoked",
    )
    client = APIClient()
    client.force_authenticate(user=learner)
    shared = client.post(
        "/api/v1/learning/evidence/shares/",
        {"evidenceId": str(evidence.id), "organizationId": str(organization.id)},
        format="json",
    )
    assert shared.status_code == 201

    revoked = client.delete(
        "/api/v1/learning/evidence/shares/",
        {"evidenceId": str(evidence.id), "organizationId": str(organization.id)},
        format="json",
    )
    assert revoked.status_code == 204
    assert LearningEvidenceShare.objects.filter(
        evidence=evidence,
        organization=organization,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    ).count() == 0


@pytest.mark.django_db
def test_reviewer_cannot_review_their_own_evidence_even_as_organization_owner():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="self-review-owner@example.com")
    organization = OrganizationService.create_organization(name="No Self Review Org", created_by=learner)
    _, outcome = create_learning_outcome(key="self-review-evidence")
    evidence = LearningEvidence.objects.create(
        user=learner,
        outcome=outcome,
        evidence_type=LearningEvidence.EvidenceType.REFLECTION,
        title="Personal reflection",
    )
    client = APIClient()
    client.force_authenticate(user=learner)
    share = client.post(
        "/api/v1/learning/evidence/shares/",
        {"evidenceId": str(evidence.id), "organizationId": str(organization.id)},
        format="json",
    )
    assert share.status_code == 201

    response = client.post(
        f"/api/v1/learning/organizations/{organization.id}/evidence/{evidence.id}/review/",
        {"decision": "verified"},
        format="json",
    )
    assert response.status_code == 403
    evidence.refresh_from_db()
    assert evidence.status == LearningEvidence.Status.PENDING
