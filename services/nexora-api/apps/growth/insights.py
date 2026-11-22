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
