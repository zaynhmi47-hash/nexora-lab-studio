from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.growth.models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn, GrowthJournalEntry
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email=email, timezone="UTC")


@pytest.mark.django_db
def test_snapshot_aggregates_recorded_activity_without_exposing_private_content():
    user = make_user("snapshot-owner@example.com")
    today = timezone.localdate()
    goal = GrowthGoal.objects.create(
        user=user, title="Learn a new skill", start_date=today - timedelta(days=4)
    )
    habit = GrowthHabit.objects.create(
        user=user, title="Practice", frequency=GrowthHabit.Frequency.DAILY,
        weekly_target=7, start_date=today - timedelta(days=4),
    )
    GrowthHabitCheckIn.objects.create(
        habit=habit, entry_date=today - timedelta(days=1),
        status=GrowthHabitCheckIn.Status.COMPLETED, note="A private check-in note",
    )
    GrowthHabitCheckIn.objects.create(
        habit=habit, entry_date=today,
        status=GrowthHabitCheckIn.Status.SKIPPED, note="Another private note",
    )
    GrowthJournalEntry.objects.create(
        user=user, entry_date=today, body="A highly personal reflection",
        mood=GrowthJournalEntry.Mood.VERY_LOW, gratitude=["Private gratitude"],
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/v1/growth/insights/?window=7")

    assert response.status_code == 200
    data = response.json()
    assert data["window"]["days"] == 7
    assert data["goals"]["total"] == 1
    assert data["habits"]["completedCheckIns"] == 1
    assert data["habits"]["skippedCheckIns"] == 1
    assert data["habits"]["adherencePercentOfRecordedCheckIns"] == 50
    assert data["journal"] == {
        "entriesInWindow": 1,
        "contentIncluded": False,
        "moodAnalysisIncluded": False,
    }
    assert "A highly personal reflection" not in str(data)
    assert "Private gratitude" not in str(data)
    assert "private check-in note" not in str(data).lower()
    assert data["dataCoverage"] == "recorded_activity_available"


@pytest.mark.django_db
def test_snapshot_is_owner_scoped_and_reports_insufficient_information():
    owner = make_user("snapshot-private-owner@example.com")
    other = make_user("snapshot-private-other@example.com")
    GrowthGoal.objects.create(user=owner, title="Private goal", start_date=timezone.localdate())

    client = APIClient()
    client.force_authenticate(user=other)
    response = client.get("/api/v1/growth/insights/")

    assert response.status_code == 200
    assert response.json()["goals"]["total"] == 0
    assert response.json()["dataCoverage"] == "insufficient_information"
    assert "Private goal" not in str(response.json())


@pytest.mark.django_db
def test_snapshot_excludes_soft_deleted_records_and_rejects_invalid_window():
    user = make_user("snapshot-window@example.com")
    goal = GrowthGoal.objects.create(user=user, title="Deleted goal", start_date=timezone.localdate())
    goal.soft_delete()

    client = APIClient()
    client.force_authenticate(user=user)
    assert client.get("/api/v1/growth/insights/?window=14").status_code == 400
    response = client.get("/api/v1/growth/insights/?window=30")
    assert response.status_code == 200
    assert response.json()["goals"]["total"] == 0
    assert response.json()["dataCoverage"] == "insufficient_information"


@pytest.mark.django_db
def test_snapshot_requires_authentication():
    assert APIClient().get("/api/v1/growth/insights/").status_code == 401
