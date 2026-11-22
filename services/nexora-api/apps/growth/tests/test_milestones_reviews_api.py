from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.growth.models import (
    GrowthDevelopmentReview,
    GrowthEvidenceEvent,
    GrowthMilestone,
    GrowthMilestoneEvidence,
)
from apps.growth.services import GrowthService
from apps.identity.models import NexoraUser


@pytest.fixture
def milestone_users(db):
    owner = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="milestone-owner@example.com",
        timezone="UTC",
    )
    other = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="milestone-other@example.com",
        timezone="UTC",
    )
    return owner, other


@pytest.mark.django_db
def test_milestone_create_update_and_evidence_link_are_owner_scoped(milestone_users):
    owner, other = milestone_users
    today = timezone.localdate()
    goal = GrowthService.create_goal(
        user=owner,
        title="Complete a portfolio project",
        start_date=today,
    )
    event = GrowthEvidenceEvent.objects.get(user=owner, subject_id=str(goal.id))
    foreign_goal = GrowthService.create_goal(
        user=other,
        title="Private goal",
        start_date=today,
    )
    foreign_event = GrowthEvidenceEvent.objects.get(user=other, subject_id=str(foreign_goal.id))

    client = APIClient()
    client.force_authenticate(user=owner)
    created = client.post(
        "/api/v1/growth/milestones/",
        {
            "title": "Publish first portfolio",
            "description": "Demonstrate practical design competence.",
            "pillar": GrowthMilestone.Pillar.SKILLS,
            "success_criteria": ["Publish a case study", "Explain design decisions"],
            "target_date": (today + timedelta(days=14)).isoformat(),
        },
        format="json",
    )
    assert created.status_code == 201
    milestone_id = created.json()["id"]

    linked = client.post(
        f"/api/v1/growth/milestones/{milestone_id}/evidence/",
        {"evidence_event_id": str(event.id)},
        format="json",
    )
    assert linked.status_code == 201
    assert GrowthMilestoneEvidence.objects.filter(
        milestone_id=milestone_id, evidence_event=event, user=owner,
    ).exists()

    foreign_link = client.post(
        f"/api/v1/growth/milestones/{milestone_id}/evidence/",
        {"evidence_event_id": str(foreign_event.id)},
        format="json",
    )
    assert foreign_link.status_code == 404

    completed = client.patch(
        f"/api/v1/growth/milestones/{milestone_id}/",
        {"status": GrowthMilestone.Status.ACHIEVED},
        format="json",
    )
    assert completed.status_code == 200
    assert completed.json()["achieved_at"] is not None
    assert client.get("/api/v1/growth/milestones/").json()[0]["evidenceCount"] == 1


@pytest.mark.django_db
def test_development_review_snapshots_activity_without_scoring_the_person(milestone_users):
    owner, other = milestone_users
    today = timezone.localdate()
    goal = GrowthService.create_goal(
        user=owner,
        title="Practice public speaking",
        start_date=today,
    )
    event = GrowthEvidenceEvent.objects.get(user=owner, subject_id=str(goal.id))
    milestone = GrowthMilestone.objects.create(
        user=owner,
        title="Deliver a short presentation",
        pillar=GrowthMilestone.Pillar.SOCIAL_EMOTIONAL,
        status=GrowthMilestone.Status.IN_PROGRESS,
    )
    GrowthMilestoneEvidence.objects.create(
        user=owner,
        milestone=milestone,
        evidence_event=event,
    )
    GrowthMilestone.objects.create(
        user=owner,
        title="Plan next learning sprint",
        pillar=GrowthMilestone.Pillar.INTELLECTUAL,
        status=GrowthMilestone.Status.PLANNED,
    )

    client = APIClient()
    client.force_authenticate(user=owner)
    response = client.post(
        "/api/v1/growth/reviews/",
        {
            "period": GrowthDevelopmentReview.Period.WEEKLY,
            "reflection": "I became more comfortable presenting.",
            "next_steps": ["Practice with a small group"],
        },
        format="json",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["evidenceCount"] == 1
    assert data["activeMilestoneCount"] == 2
    assert data["pillarActivity"] == {GrowthMilestone.Pillar.SOCIAL_EMOTIONAL: 1}
    assert "score" not in data
    assert data["reflection"] == "I became more comfortable presenting."

    listing = client.get("/api/v1/growth/reviews/")
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    other_client = APIClient()
    other_client.force_authenticate(user=other)
    assert other_client.get("/api/v1/growth/reviews/").json() == []


@pytest.mark.django_db
def test_milestone_and_review_endpoints_require_authentication():
    client = APIClient()
    assert client.get("/api/v1/growth/milestones/").status_code == 401
    assert client.get("/api/v1/growth/reviews/").status_code == 401
