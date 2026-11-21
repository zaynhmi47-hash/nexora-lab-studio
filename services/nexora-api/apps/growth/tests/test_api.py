import pytest
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.growth.models import GrowthGoal, GrowthJournalEntry


def make_user(email):
    return NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email=email)


@pytest.mark.django_db
def test_goals_are_private_to_the_authenticated_owner():
    owner = make_user("growth-owner@example.com")
    other = make_user("growth-other@example.com")
    goal = GrowthGoal.objects.create(
        user=owner,
        title="Build a learning routine",
        start_date="2026-11-01",
    )
    client = APIClient()
    client.force_authenticate(user=other)

    response = client.get("/api/v1/growth/goals/")

    assert response.status_code == 200
    assert response.json() == []
    update = client.patch(
        f"/api/v1/growth/goals/{goal.id}/",
        {"title": "Unauthorized edit"},
        format="json",
    )
    assert update.status_code == 404
    goal.refresh_from_db()
    assert goal.title == "Build a learning routine"


@pytest.mark.django_db
def test_user_can_create_and_complete_goal_with_explicit_transition():
    user = make_user("goal-lifecycle@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    created = client.post(
        "/api/v1/growth/goals/",
        {
            "title": "Practice public speaking",
            "description": "Build confidence through small speaking opportunities.",
            "category": "personal",
            "success_criteria": ["Deliver a five-minute talk", "Ask for feedback"],
            "start_date": "2026-11-01",
            "target_date": "2026-12-01",
        },
        format="json",
    )
    assert created.status_code == 201
    goal_id = created.json()["id"]
    assert created.json()["status"] == GrowthGoal.Status.ACTIVE

    completed = client.patch(
        f"/api/v1/growth/goals/{goal_id}/",
        {"status": GrowthGoal.Status.COMPLETED},
        format="json",
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == GrowthGoal.Status.COMPLETED
    assert completed.json()["completed_at"] is not None


@pytest.mark.django_db
def test_goal_rejects_target_date_before_start_date():
    user = make_user("goal-date-validation@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/v1/growth/goals/",
        {
            "title": "Invalid date goal",
            "start_date": "2026-12-02",
            "target_date": "2026-12-01",
        },
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_journal_entries_are_private_and_soft_deleted():
    owner = make_user("journal-owner@example.com")
    other = make_user("journal-other@example.com")
    client = APIClient()
    client.force_authenticate(user=owner)

    created = client.post(
        "/api/v1/growth/journal/",
        {
            "entry_date": "2026-11-22",
            "title": "A small win",
            "prompt": "What went well today?",
            "body": "I finished an important task and asked for feedback.",
            "mood": GrowthJournalEntry.Mood.GOOD,
            "gratitude": ["A supportive colleague"],
        },
        format="json",
    )
    assert created.status_code == 201
    entry_id = created.json()["id"]

    other_client = APIClient()
    other_client.force_authenticate(user=other)
    assert other_client.get("/api/v1/growth/journal/").json() == []
    assert other_client.patch(
        f"/api/v1/growth/journal/{entry_id}/",
        {"body": "Trying to read another person's journal."},
        format="json",
    ).status_code == 404

    deleted = client.delete(f"/api/v1/growth/journal/{entry_id}/")
    assert deleted.status_code == 204
    entry = GrowthJournalEntry.objects.get(id=entry_id)
    assert entry.deleted_at is not None
    assert client.get("/api/v1/growth/journal/").json() == []


@pytest.mark.django_db
def test_journal_rejects_empty_reflection_and_invalid_gratitude():
    user = make_user("journal-validation@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    empty = client.post(
        "/api/v1/growth/journal/",
        {"entry_date": "2026-11-22", "body": "   "},
        format="json",
    )
    assert empty.status_code == 400

    invalid_gratitude = client.post(
        "/api/v1/growth/journal/",
        {
            "entry_date": "2026-11-22",
            "body": "A reflection",
            "gratitude": ["", "A good day"],
        },
        format="json",
    )
    assert invalid_gratitude.status_code == 400


@pytest.mark.django_db
def test_growth_endpoints_require_authentication():
    client = APIClient()

    assert client.get("/api/v1/growth/goals/").status_code == 401
    assert client.get("/api/v1/growth/journal/").status_code == 401
