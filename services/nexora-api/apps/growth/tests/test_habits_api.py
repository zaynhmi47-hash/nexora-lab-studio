from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.growth.models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email=email, timezone="UTC")


@pytest.mark.django_db
def test_habits_are_private_and_foreign_goals_cannot_be_linked():
    owner = make_user("habit-owner@example.com")
    other = make_user("habit-other@example.com")
    goal = GrowthGoal.objects.create(
        user=owner,
        title="Improve health",
        start_date="2026-11-01",
    )
    client = APIClient()
    client.force_authenticate(user=other)

    response = client.post(
        "/api/v1/growth/habits/",
        {
            "title": "Walk every morning",
            "frequency": "daily",
            "weekly_target": 7,
            "start_date": "2026-11-01",
            "goal": str(goal.id),
        },
        format="json",
    )
    assert response.status_code == 400
    assert client.get("/api/v1/growth/habits/").json() == []

    habit = GrowthHabit.objects.create(
        user=owner,
        title="Walk every morning",
        frequency=GrowthHabit.Frequency.DAILY,
        weekly_target=7,
        start_date="2026-11-01",
    )
    assert client.patch(
        f"/api/v1/growth/habits/{habit.id}/",
        {"title": "Read another person's habit"},
        format="json",
    ).status_code == 404


@pytest.mark.django_db
def test_habit_creation_and_check_in_are_idempotent_per_day():
    user = make_user("habit-checkin@example.com")
    client = APIClient()
    client.force_authenticate(user=user)
    today = timezone.localdate()

    created = client.post(
        "/api/v1/growth/habits/",
        {
            "title": "Read for twenty minutes",
            "frequency": "daily",
            "weekly_target": 7,
            "start_date": (today - timedelta(days=5)).isoformat(),
        },
        format="json",
    )
    assert created.status_code == 201
    habit_id = created.json()["id"]

    first = client.post(
        f"/api/v1/growth/habits/{habit_id}/check-ins/",
        {"entry_date": today.isoformat(), "status": "completed", "note": "Finished one chapter."},
        format="json",
    )
    second = client.post(
        f"/api/v1/growth/habits/{habit_id}/check-ins/",
        {"entry_date": today.isoformat(), "status": "skipped", "note": "Updated check-in."},
        format="json",
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert GrowthHabitCheckIn.objects.filter(habit_id=habit_id, entry_date=today).count() == 1
    check_in = GrowthHabitCheckIn.objects.get(habit_id=habit_id, entry_date=today)
    assert check_in.status == GrowthHabitCheckIn.Status.SKIPPED
    assert check_in.note == "Updated check-in"


@pytest.mark.django_db
def test_daily_habit_summary_counts_ongoing_streak_when_today_is_not_logged():
    user = make_user("habit-streak@example.com")
    client = APIClient()
    client.force_authenticate(user=user)
    today = timezone.localdate()

    created = client.post(
        "/api/v1/growth/habits/",
        {
            "title": "Practice a language",
            "frequency": "daily",
            "weekly_target": 7,
            "start_date": (today - timedelta(days=10)).isoformat(),
        },
        format="json",
    )
    habit_id = created.json()["id"]
    for offset in (2, 1):
        response = client.post(
            f"/api/v1/growth/habits/{habit_id}/check-ins/",
            {
                "entry_date": (today - timedelta(days=offset)).isoformat(),
                "status": "completed",
            },
            format="json",
        )
        assert response.status_code == 201

    habits = client.get("/api/v1/growth/habits/").json()
    assert habits[0]["summary"]["dailyStreak"] == 2
    assert habits[0]["summary"]["completedThisWeek"] == 2


@pytest.mark.django_db
def test_habit_rejects_future_check_ins_and_invalid_weekly_target():
    user = make_user("habit-validation@example.com")
    client = APIClient()
    client.force_authenticate(user=user)
    today = timezone.localdate()

    invalid = client.post(
        "/api/v1/growth/habits/",
        {
            "title": "Weekly exercise",
            "frequency": "weekly",
            "weekly_target": 8,
            "start_date": today.isoformat(),
        },
        format="json",
    )
    assert invalid.status_code == 400

    created = client.post(
        "/api/v1/growth/habits/",
        {
            "title": "Daily exercise",
            "frequency": "daily",
            "weekly_target": 7,
            "start_date": today.isoformat(),
        },
        format="json",
    )
    habit_id = created.json()["id"]
    future = client.post(
        f"/api/v1/growth/habits/{habit_id}/check-ins/",
        {
            "entry_date": (today + timedelta(days=1)).isoformat(),
            "status": "completed",
        },
        format="json",
    )
    assert future.status_code == 400


@pytest.mark.django_db
def test_habit_endpoints_require_authentication():
    client = APIClient()
    assert client.get("/api/v1/growth/habits/").status_code == 401
