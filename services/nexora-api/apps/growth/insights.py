from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Count, Q
from django.utils import timezone

from .models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn, GrowthJournalEntry


class GrowthInsightsService:
    """Build a private, deterministic snapshot from explicitly recorded activity."""

    ALLOWED_WINDOWS = (7, 30)

    @classmethod
    def build_snapshot(cls, *, user, window_days=30, today=None):
        if window_days not in cls.ALLOWED_WINDOWS:
            raise ValueError("window_days must be 7 or 30.")

        try:
            user_timezone = ZoneInfo(user.timezone)
        except (ZoneInfoNotFoundError, TypeError, ValueError):
            user_timezone = timezone.get_default_timezone()

        today = today or timezone.localdate(timezone=user_timezone)
        start_date = today - timedelta(days=window_days - 1)
        start_at = timezone.make_aware(
            datetime.combine(start_date, time.min),
            user_timezone,
        )
        end_at = timezone.make_aware(
            datetime.combine(today + timedelta(days=1), time.min),
            user_timezone,
        )

        goals = GrowthGoal.objects.filter(user=user, deleted_at__isnull=True)
        goal_counts = goals.aggregate(
            total=Count("id"),
            active=Count("id", filter=Q(status=GrowthGoal.Status.ACTIVE)),
            paused=Count("id", filter=Q(status=GrowthGoal.Status.PAUSED)),
            completed=Count("id", filter=Q(status=GrowthGoal.Status.COMPLETED)),
            archived=Count("id", filter=Q(status=GrowthGoal.Status.ARCHIVED)),
        )
        goals_created = goals.filter(created_at__gte=start_at, created_at__lt=end_at).count()
        goals_completed = goals.filter(completed_at__gte=start_at, completed_at__lt=end_at).count()

        habits = GrowthHabit.objects.filter(
            user=user,
            deleted_at__isnull=True,
            status=GrowthHabit.Status.ACTIVE,
            start_date__lte=today,
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
        habit_count = habits.count()
        check_ins = GrowthHabitCheckIn.objects.filter(
            habit__user=user,
            habit__deleted_at__isnull=True,
            deleted_at__isnull=True,
            entry_date__range=(start_date, today),
        )
        completed_check_ins = check_ins.filter(status=GrowthHabitCheckIn.Status.COMPLETED).count()
        skipped_check_ins = check_ins.filter(status=GrowthHabitCheckIn.Status.SKIPPED).count()
        recorded_check_ins = completed_check_ins + skipped_check_ins
        adherence = round(completed_check_ins / recorded_check_ins * 100) if recorded_check_ins else None

        journal_count = GrowthJournalEntry.objects.filter(
            user=user,
            deleted_at__isnull=True,
            entry_date__range=(start_date, today),
        ).count()

        recommendations = []
        if goal_counts["total"] == 0:
            recommendations.append({
                "code": "define_first_goal",
                "message": "If it feels useful, define one small goal to give your next steps a direction.",
                "evidence": "No active or completed goals are currently recorded.",
            })
        if habit_count and recorded_check_ins == 0:
            recommendations.append({
                "code": "record_a_habit_checkin",
                "message": "Try recording one habit check-in so your routine history can become visible.",
                "evidence": f"No habit check-ins were recorded in the last {window_days} days.",
            })
        if journal_count == 0:
            recommendations.append({
                "code": "optional_reflection",
                "message": "You could add a short reflection if writing helps you review your experience.",
                "evidence": f"No journal entries were recorded in the last {window_days} days.",
            })

        has_any_evidence = bool(goal_counts["total"] or recorded_check_ins or journal_count)
        return {
            "window": {
                "days": window_days,
                "startDate": start_date.isoformat(),
                "endDate": today.isoformat(),
            },
            "generatedAt": timezone.now().isoformat(),
            "dataCoverage": "recorded_activity_available" if has_any_evidence else "insufficient_information",
            "goals": {
                **goal_counts,
                "createdInWindow": goals_created,
                "completedInWindow": goals_completed,
            },
            "habits": {
                "active": habit_count,
                "completedCheckIns": completed_check_ins,
                "skippedCheckIns": skipped_check_ins,
                "recordedCheckIns": recorded_check_ins,
                "adherencePercentOfRecordedCheckIns": adherence,
                "adherenceBasis": "completed / (completed + skipped); unrecorded days are excluded",
            },
            "journal": {
                "entriesInWindow": journal_count,
                "contentIncluded": False,
                "moodAnalysisIncluded": False,
            },
            "recommendations": recommendations,
            "limitations": [
                "This snapshot describes recorded activity, not personal worth, ability, health, or psychological state.",
                "Missing records are not interpreted as failed activity or lack of growth.",
                "No journal body, gratitude text, mood value, or habit note is included.",
            ],
        }


class GrowthTimelineService:
    """Return a chronological, owner-only index of recorded growth evidence."""

    @classmethod
    def build_timeline(cls, *, user, window_days=30, limit=50, today=None):
        if window_days not in GrowthInsightsService.ALLOWED_WINDOWS:
            raise ValueError("window_days must be 7 or 30.")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100.")

        try:
            user_timezone = ZoneInfo(user.timezone)
        except (ZoneInfoNotFoundError, TypeError, ValueError):
            user_timezone = timezone.get_default_timezone()
        today = today or timezone.localdate(timezone=user_timezone)
        start_date = today - timedelta(days=window_days - 1)
        events = []

        goals = GrowthGoal.objects.filter(
            user=user, deleted_at__isnull=True,
            created_at__date__gte=start_date, created_at__date__lte=today,
        ).only("id", "title", "created_at")
        for goal in goals:
            events.append({
                "id": f"goal-created:{goal.id}",
                "date": timezone.localtime(goal.created_at, user_timezone).date().isoformat(),
                "type": "goal_created",
                "title": "Goal created",
                "description": goal.title,
                "evidence": {"kind": "goal", "id": str(goal.id)},
                "relatedGoalId": str(goal.id),
            })

        completed_goals = GrowthGoal.objects.filter(
            user=user, deleted_at__isnull=True,
            status=GrowthGoal.Status.COMPLETED,
            completed_at__date__gte=start_date, completed_at__date__lte=today,
        ).only("id", "title", "completed_at")
        for goal in completed_goals:
            events.append({
                "id": f"goal-completed:{goal.id}",
                "date": timezone.localtime(goal.completed_at, user_timezone).date().isoformat(),
                "type": "goal_completed",
                "title": "Goal completed",
                "description": goal.title,
                "evidence": {"kind": "goal", "id": str(goal.id)},
                "relatedGoalId": str(goal.id),
            })

        check_ins = GrowthHabitCheckIn.objects.filter(
            habit__user=user, habit__deleted_at__isnull=True,
            deleted_at__isnull=True,
            entry_date__range=(start_date, today),
        ).select_related("habit").only(
            "id", "entry_date", "status", "habit__id", "habit__title", "habit__goal_id",
        )
        for item in check_ins:
            events.append({
                "id": f"habit-checkin:{item.id}",
                "date": item.entry_date.isoformat(),
                "type": f"habit_{item.status}",
                "title": "Habit completed" if item.status == GrowthHabitCheckIn.Status.COMPLETED else "Habit skipped",
                "description": item.habit.title,
                "evidence": {"kind": "habit_check_in", "id": str(item.id)},
                "relatedGoalId": str(item.habit.goal_id) if item.habit.goal_id else None,
            })

        journal_entries = GrowthJournalEntry.objects.filter(
            user=user, deleted_at__isnull=True,
            entry_date__range=(start_date, today),
        ).only("id", "entry_date")
        for entry in journal_entries:
            events.append({
                "id": f"journal:{entry.id}",
                "date": entry.entry_date.isoformat(),
                "type": "reflection_recorded",
                "title": "Private reflection recorded",
                "description": None,
                "evidence": {"kind": "journal_entry", "id": str(entry.id)},
                "relatedGoalId": None,
            })

        events.sort(key=lambda event: (event["date"], event["id"]), reverse=True)
        return {
            "window": {
                "days": window_days,
                "startDate": start_date.isoformat(),
                "endDate": today.isoformat(),
            },
            "generatedAt": timezone.now().isoformat(),
            "items": events[:limit],
            "total": len(events),
            "hasMore": len(events) > limit,
            "privacy": {
                "journalContentIncluded": False,
                "habitNotesIncluded": False,
                "moodIncluded": False,
            },
            "limitations": [
                "Timeline entries represent recorded events, not a complete measure of personal development.",
                "A goal's current title is shown for its recorded creation and completion events.",
                "Private reflection content and habit notes are never included.",
            ],
        }
