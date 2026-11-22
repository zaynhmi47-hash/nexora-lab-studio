from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.growth.insights import GrowthTimelineService
from apps.growth.models import GrowthEvidenceEvent, GrowthGoal, GrowthHabit
from apps.growth.services import GrowthEvidenceLedger, GrowthHabitService, GrowthService
from apps.identity.models import NexoraUser


@pytest.fixture
def growth_user(db):
    return NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="growth-ledger@example.com",
        timezone="UTC",
    )


@pytest.mark.django_db
def test_goal_lifecycle_is_recorded_as_distinct_immutable_events(growth_user):
    today = timezone.localdate()
    goal = GrowthService.create_goal(
        user=growth_user,
        title="Build a portfolio",
        start_date=today,
    )
    GrowthService.update_goal(
        user=growth_user,
        goal_id=goal.id,
        status=GrowthGoal.Status.COMPLETED,
    )

    events = list(GrowthEvidenceEvent.objects.filter(user=growth_user).order_by("occurred_at"))
    assert [event.event_type for event in events] == [
        GrowthEvidenceEvent.EventType.GOAL_CREATED,
        GrowthEvidenceEvent.EventType.GOAL_STATUS_CHANGED,
    ]
    assert events[1].metadata == {
        "previous_status": GrowthGoal.Status.ACTIVE,
        "new_status": GrowthGoal.Status.COMPLETED,
    }
    with pytest.raises(ValidationError, match="immutable"):
        events[0].save()
    with pytest.raises(ValidationError, match="cannot be deleted"):
        events[0].delete()


@pytest.mark.django_db
def test_habit_checkin_status_changes_are_separately_recorded_without_notes(growth_user):
    today = timezone.localdate()
    habit = GrowthHabit.objects.create(
        user=growth_user,
        title="Daily practice",
        start_date=today - timedelta(days=2),
    )
    GrowthHabitService.check_in(
        user=growth_user,
        habit_id=habit.id,
        entry_date=today,
        status="completed",
        note="private note must not be copied",
    )
    GrowthHabitService.check_in(
        user=growth_user,
        habit_id=habit.id,
        entry_date=today,
        status="skipped",
        note="another private note",
    )

    events = list(GrowthEvidenceEvent.objects.filter(user=growth_user))
    assert len(events) == 2
    assert {event.event_type for event in events} == {
        GrowthEvidenceEvent.EventType.HABIT_CHECK_IN_RECORDED,
        GrowthEvidenceEvent.EventType.HABIT_CHECK_IN_CHANGED,
    }
    serialized = str([event.metadata for event in events])
    assert "private note" not in serialized
    assert "another private note" not in serialized


@pytest.mark.django_db
def test_timeline_prefers_ledger_events_and_does_not_duplicate_goal_history(growth_user):
    today = timezone.localdate()
    goal = GrowthService.create_goal(
        user=growth_user,
        title="Learn consistently",
        start_date=today,
    )
    GrowthService.update_goal(
        user=growth_user,
        goal_id=goal.id,
        status=GrowthGoal.Status.COMPLETED,
    )

    timeline = GrowthTimelineService.build_timeline(user=growth_user, window_days=7)
    goal_events = [item for item in timeline["items"] if item["evidence"]["id"] == str(goal.id)]
    assert len(goal_events) == 2
    assert {item["title"] for item in goal_events} == {"Goal created", "Goal completed"}
    assert len({item["id"] for item in goal_events}) == 2


@pytest.mark.django_db
def test_ledger_rejects_unapproved_metadata(growth_user):
    with pytest.raises(ValidationError, match="Unsupported evidence metadata"):
        GrowthEvidenceLedger.record(
            user=growth_user,
            event_type=GrowthEvidenceEvent.EventType.GOAL_CREATED,
            subject_type="goal",
            subject_id="goal-1",
            event_key="goal:goal-1:created",
            metadata={"journal_body": "must never be stored"},
        )
    assert GrowthEvidenceEvent.objects.count() == 0
