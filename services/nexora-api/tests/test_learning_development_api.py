import pytest
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.learning.models import (
    LearningCompetency,
    LearningDevelopmentPlan,
    LearningMasteryAssessmentEvent,
    LearningOutcome,
)


def create_outcome(key):
    competency = LearningCompetency.objects.create(
        key=f"{key}-competency", title="Critical thinking", domain="intellectual", is_published=True,
    )
    return LearningOutcome.objects.create(
        key=key, competency=competency, title="Evaluate a claim", is_published=True,
    )


@pytest.mark.django_db
def test_learner_can_create_and_update_private_development_plan():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-owner@example.com")
    outcome = create_outcome("plan-evaluate-claim")
    client = APIClient()
    client.force_authenticate(user=user)

    created = client.post(
        "/api/v1/learning/development-plans/",
        {
            "outcomeKey": outcome.key,
            "targetLevel": 4,
            "actions": ["Compare two sources", "Write a reasoned conclusion"],
        },
        format="json",
    )

    assert created.status_code == 201
    payload = created.json()
    assert payload["currentAssessedLevel"] is None
    assert payload["gap"] == 4
    assert payload["targetLevel"] == 4
    plan = LearningDevelopmentPlan.objects.get(id=payload["id"], user=user)

    updated = client.patch(
        "/api/v1/learning/development-plans/",
        {"planId": str(plan.id), "status": "completed", "reflection": "I can now explain my reasoning."},
        format="json",
    )

    assert updated.status_code == 200
    assert updated.json()["status"] == "completed"
    assert updated.json()["reflection"] == "I can now explain my reasoning."


@pytest.mark.django_db
def test_development_plans_are_owner_scoped_and_validate_actions():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-private-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-private-other@example.com")
    outcome = create_outcome("plan-private-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=owner, outcome=outcome, target_level=3, actions=["Practice"],
    )
    client = APIClient()
    client.force_authenticate(user=other)

    listing = client.get("/api/v1/learning/development-plans/")
    update = client.patch(
        "/api/v1/learning/development-plans/",
        {"planId": str(plan.id), "status": "completed"},
        format="json",
    )
    invalid = client.post(
        "/api/v1/learning/development-plans/",
        {"outcomeKey": outcome.key, "targetLevel": 6, "actions": ["Practice"]},
        format="json",
    )

    assert listing.status_code == 200
    assert listing.json() == []
    assert update.status_code == 404
    assert invalid.status_code == 400


@pytest.mark.django_db
def test_assessment_history_is_private_to_learner():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-other@example.com")
    assessor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-assessor@example.com")
    outcome = create_outcome("history-outcome")
    LearningMasteryAssessmentEvent.objects.create(
        user=owner, outcome=outcome, level=3, status="verified",
        assessment_method="portfolio_review", rationale="Clear evidence of application.",
        assessed_by=assessor,
    )
    client = APIClient()
    client.force_authenticate(user=other)

    response = client.get("/api/v1/learning/assessment-history/")

    assert response.status_code == 200
    assert response.json() == []
