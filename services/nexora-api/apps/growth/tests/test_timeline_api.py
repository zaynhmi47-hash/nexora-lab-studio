from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.growth.models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn, GrowthJournalEntry
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_timeline_orders_owner_evidence_and_excludes_private_text():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="timeline-owner@example.com",
        timezone="UTC",
    )
    today = timezone.localdate()
    goal = GrowthGoal.objects.create(
        user=user, title="Build a portfolio", start_date=today - timedelta(days=3),
    )
    habit = GrowthHabit.objects.create(
        user=user, goal=goal, title="Practice design", start_date=today - timedelta(days=3),
    )
    check_in = GrowthHabitCheckIn.objects.create(
        habit=habit, entry_date=today, status=GrowthHabitCheckIn.Status.COMPLETED,
        note="This private note must not appear",
    )
    GrowthJournalEntry.objects.create(
        user=user, entry_date=today, body="Highly personal journal body",
        mood=GrowthJournalEntry.Mood.LOW, gratitude=["private gratitude"],
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/v1/growth/timeline/?window=7")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert [item["type"] for item in data["items"][:2]] == [
        "reflection_recorded", "habit_completed",
    ]
    habit_event = next(item for item in data["items"] if item["type"] == "habit_completed")
    assert habit_event["evidence"] == {"kind": "habit_check_in", "id": str(check_in.id)}
    assert habit_event["relatedGoalId"] == str(goal.id)
    assert data["privacy"] == {
        "journalContentIncluded": False,
        "habitNotesIncluded": False,
        "moodIncluded": False,
    }
    serialized = str(data)
    assert "Highly personal journal body" not in serialized
    assert "private note" not in serialized
    assert "private gratitude" not in serialized


@pytest.mark.django_db
def test_timeline_is_owner_scoped_excludes_soft_deleted_and_paginates():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="timeline-a@example.com", timezone="UTC")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="timeline-b@example.com", timezone="UTC")
    today = timezone.localdate()
    goal = GrowthGoal.objects.create(user=owner, title="Owner only", start_date=today)
    GrowthGoal.objects.create(user=other, title="Other account", start_date=today)
    deleted = GrowthGoal.objects.create(user=owner, title="Deleted", start_date=today)
    deleted.soft_delete()

    client = APIClient()
    client.force_authenticate(user=owner)
    response = client.get("/api/v1/growth/timeline/?window=30&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["hasMore"] is False
    assert "Other account" not in str(data)
    assert "Deleted" not in str(data)
    assert str(goal.id) in str(data)


@pytest.mark.django_db
def test_timeline_validates_window_and_limit_and_requires_authentication():
    client = APIClient()
    assert client.get("/api/v1/growth/timeline/").status_code == 401

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="timeline-validation@example.com", timezone="UTC")
    client.force_authenticate(user=user)
    assert client.get("/api/v1/growth/timeline/?window=14").status_code == 400
    assert client.get("/api/v1/growth/timeline/?limit=0").status_code == 400
