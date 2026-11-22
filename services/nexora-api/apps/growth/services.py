from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone

from .models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn, GrowthJournalEntry


class GrowthEvidenceLedger:
    """Persist minimal activity facts atomically with their source mutation."""

    ALLOWED_METADATA_KEYS = {
        "previous_status", "new_status", "entry_date", "frequency", "weekly_target",
    }

    @classmethod
    def record(cls, *, user, event_type, subject_type, subject_id, event_key, metadata=None, occurred_at=None):
        from .models import GrowthEvidenceEvent

        safe_metadata = metadata or {}
        if not isinstance(safe_metadata, dict) or set(safe_metadata) - cls.ALLOWED_METADATA_KEYS:
            raise ValidationError({"metadata": "Unsupported evidence metadata."})
        return GrowthEvidenceEvent.objects.get_or_create(
            event_key=event_key,
            defaults={
                "user": user,
                "event_type": event_type,
                "subject_type": subject_type,
                "subject_id": str(subject_id),
                "occurred_at": occurred_at or timezone.now(),
                "metadata": safe_metadata,
            },
        )[0]


class GrowthService:
    @staticmethod
    @transaction.atomic
    def create_goal(*, user, **data):
        goal = GrowthGoal(user=user, **data)
        goal.full_clean()
        goal.save()
        GrowthEvidenceLedger.record(
            user=user, event_type="goal.created", subject_type="goal", subject_id=goal.id,
            event_key=f"goal:{goal.id}:created",
        )
        return goal

    @staticmethod
    @transaction.atomic
    def update_goal(*, user, goal_id, **changes):
        goal = GrowthGoal.objects.select_for_update().filter(
            id=goal_id,
            user=user,
            deleted_at__isnull=True,
        ).first()
        if goal is None:
            raise GrowthGoal.DoesNotExist
        if goal.status == GrowthGoal.Status.ARCHIVED:
            raise ValidationError("Archived goals cannot be edited.")
        previous_status = goal.status
        if changes.get("status") == GrowthGoal.Status.COMPLETED:
            changes["completed_at"] = timezone.now()
        elif changes.get("status") in (GrowthGoal.Status.ACTIVE, GrowthGoal.Status.PAUSED):
            changes["completed_at"] = None
        for field, value in changes.items():
            setattr(goal, field, value)
        goal.full_clean()
        goal.save()
        if goal.status != previous_status:
            GrowthEvidenceLedger.record(
                user=user, event_type="goal.status_changed", subject_type="goal", subject_id=goal.id,
                event_key=f"goal:{goal.id}:status:{goal.updated_at.isoformat()}",
                metadata={"previous_status": previous_status, "new_status": goal.status},
                occurred_at=goal.updated_at,
            )
        return goal

    @staticmethod
    @transaction.atomic
    def create_journal_entry(*, user, **data):
        entry = GrowthJournalEntry(user=user, **data)
        entry.full_clean()
        entry.save()
        return entry

    @staticmethod
    @transaction.atomic
    def update_journal_entry(*, user, entry_id, **changes):
        entry = GrowthJournalEntry.objects.select_for_update().filter(
            id=entry_id,
            user=user,
            deleted_at__isnull=True,
        ).first()
        if entry is None:
            raise GrowthJournalEntry.DoesNotExist
        for field, value in changes.items():
            setattr(entry, field, value)
        entry.full_clean()
        entry.save()
        return entry

    @staticmethod
    @transaction.atomic
    def delete_journal_entry(*, user, entry_id):
        entry = GrowthJournalEntry.objects.select_for_update().filter(
            id=entry_id,
            user=user,
            deleted_at__isnull=True,
        ).first()
        if entry is None:
            raise GrowthJournalEntry.DoesNotExist
        entry.soft_delete()


class GrowthHabitService:
    @staticmethod
    @transaction.atomic
    def create_habit(*, user, **data):
        goal = data.get("goal")
        if goal is not None and goal.user_id != user.id:
            raise ValidationError({"goal": "A habit can only link to one of your own goals."})
        habit = GrowthHabit(user=user, **data)
        habit.full_clean()
        habit.save()
        GrowthEvidenceLedger.record(
            user=user, event_type="habit.created", subject_type="habit", subject_id=habit.id,
            event_key=f"habit:{habit.id}:created",
            metadata={"frequency": habit.frequency, "weekly_target": habit.weekly_target},
        )
        return habit

    @staticmethod
    @transaction.atomic
    def update_habit(*, user, habit_id, **changes):
        habit = GrowthHabit.objects.select_for_update().filter(
            id=habit_id,
            user=user,
            deleted_at__isnull=True,
        ).first()
        if habit is None:
            raise GrowthHabit.DoesNotExist
        if habit.status == GrowthHabit.Status.ARCHIVED:
            raise ValidationError("Archived habits cannot be edited.")
        goal = changes.get("goal")
        if goal is not None and goal.user_id != user.id:
            raise ValidationError({"goal": "A habit can only link to one of your own goals."})
        for field, value in changes.items():
            setattr(habit, field, value)
        habit.full_clean()
        habit.save()
        return habit

    @staticmethod
    @transaction.atomic
    def check_in(*, user, habit_id, entry_date, status, note=""):
        habit = GrowthHabit.objects.select_for_update().filter(
            id=habit_id,
            user=user,
            deleted_at__isnull=True,
            status=GrowthHabit.Status.ACTIVE,
            start_date__lte=entry_date,
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=entry_date),
        ).first()
        if habit is None:
            raise GrowthHabit.DoesNotExist
        if status not in GrowthHabitCheckIn.Status.values:
            raise ValidationError({"status": "Choose completed or skipped."})
        try:
            user_timezone = ZoneInfo(user.timezone)
        except ZoneInfoNotFoundError:
            user_timezone = timezone.get_default_timezone()
        if entry_date > timezone.localdate(timezone=user_timezone):
            raise ValidationError({"entry_date": "Future habit check-ins are not allowed."})
        check_in = GrowthHabitCheckIn.objects.filter(
            habit=habit,
            entry_date=entry_date,
            deleted_at__isnull=True,
        ).first()
        previous_status = check_in.status if check_in is not None else None
        if check_in is None:
            check_in = GrowthHabitCheckIn(
                habit=habit,
                entry_date=entry_date,
                status=status,
                note=note,
            )
        else:
            check_in.status = status
            check_in.note = note
        check_in.full_clean()
        check_in.save()
        if previous_status != check_in.status:
            event_type = (
                "habit.check_in_recorded" if previous_status is None else "habit.check_in_changed"
            )
            GrowthEvidenceLedger.record(
                user=user, event_type=event_type, subject_type="habit_check_in", subject_id=check_in.id,
                event_key=f"habit-check-in:{check_in.id}:updated:{check_in.updated_at.isoformat()}",
                metadata={
                    **({"previous_status": previous_status} if previous_status else {}),
                    "new_status": check_in.status,
                    "entry_date": check_in.entry_date.isoformat(),
                },
                occurred_at=check_in.updated_at,
            )
        return check_in

    @staticmethod
    def habit_summary(*, user, habit, today=None):
        try:
            user_timezone = ZoneInfo(user.timezone)
        except ZoneInfoNotFoundError:
            user_timezone = timezone.get_default_timezone()
        today = today or timezone.localdate(timezone=user_timezone)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        check_ins = GrowthHabitCheckIn.objects.filter(
            habit=habit,
            deleted_at__isnull=True,
            entry_date__range=(week_start, min(week_end, today)),
        )
        completed = check_ins.filter(status=GrowthHabitCheckIn.Status.COMPLETED).count()
        skipped = check_ins.filter(status=GrowthHabitCheckIn.Status.SKIPPED).count()
        recent = GrowthHabitCheckIn.objects.filter(
            habit=habit,
            deleted_at__isnull=True,
            entry_date__lte=today,
        ).order_by("-entry_date")
        latest = recent.first()
        streak = 0
        if habit.frequency == GrowthHabit.Frequency.DAILY and latest is not None:
            expected_date = today if latest.entry_date == today else today - timedelta(days=1)
            if latest.entry_date == today and latest.status == GrowthHabitCheckIn.Status.SKIPPED:
                expected_date = today - timedelta(days=1)
            for item in recent:
                if item.entry_date != expected_date or item.status != GrowthHabitCheckIn.Status.COMPLETED:
                    break
                streak += 1
                expected_date -= timedelta(days=1)
        return {
            "completedThisWeek": completed,
            "skippedThisWeek": skipped,
            "weeklyTarget": habit.weekly_target,
            "dailyStreak": streak if habit.frequency == GrowthHabit.Frequency.DAILY else None,
            "checkIns": [
                {
                    "id": str(item.id),
                    "date": item.entry_date.isoformat(),
                    "status": item.status,
                    "note": item.note,
                }
                for item in recent[:14]
            ],
        }

class GrowthMilestoneService:
    @staticmethod
    @transaction.atomic
    def create_milestone(*, user, **data):
        from .models import GrowthMilestone

        milestone = GrowthMilestone(user=user, **data)
        milestone.full_clean()
        milestone.save()
        return milestone

    @staticmethod
    @transaction.atomic
    def update_milestone(*, user, milestone_id, **changes):
        from .models import GrowthMilestone

        milestone = GrowthMilestone.objects.select_for_update().filter(
            id=milestone_id, user=user, deleted_at__isnull=True,
        ).first()
        if milestone is None:
            raise GrowthMilestone.DoesNotExist
        if milestone.status == GrowthMilestone.Status.CANCELLED:
            raise ValidationError("Cancelled milestones cannot be edited.")
        if changes.get("status") == GrowthMilestone.Status.ACHIEVED:
            changes["achieved_at"] = timezone.now()
        elif changes.get("status") in (
            GrowthMilestone.Status.PLANNED,
            GrowthMilestone.Status.IN_PROGRESS,
            GrowthMilestone.Status.PAUSED,
        ):
            changes["achieved_at"] = None
        for field, value in changes.items():
            setattr(milestone, field, value)
        milestone.full_clean()
        milestone.save()
        return milestone

    @staticmethod
    @transaction.atomic
    def link_evidence(*, user, milestone_id, evidence_event_id):
        from .models import GrowthEvidenceEvent, GrowthMilestone, GrowthMilestoneEvidence

        milestone = GrowthMilestone.objects.filter(
            id=milestone_id, user=user, deleted_at__isnull=True,
        ).first()
        if milestone is None:
            raise GrowthMilestone.DoesNotExist
        evidence = GrowthEvidenceEvent.objects.filter(
            id=evidence_event_id, user=user,
        ).first()
        if evidence is None:
            raise GrowthEvidenceEvent.DoesNotExist
        link, _ = GrowthMilestoneEvidence.objects.get_or_create(
            milestone=milestone, evidence_event=evidence, user=user,
        )
        return link


class GrowthDevelopmentReviewService:
    @staticmethod
    @transaction.atomic
    def create_review(*, user, period, reflection="", next_steps=None, today=None):
        from calendar import monthrange
        from datetime import timedelta
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

        from .models import (
            GrowthDevelopmentReview,
            GrowthEvidenceEvent,
            GrowthMilestone,
            GrowthMilestoneEvidence,
        )

        if period not in GrowthDevelopmentReview.Period.values:
            raise ValidationError({"period": "Choose weekly or monthly."})
        try:
            user_timezone = ZoneInfo(user.timezone)
        except ZoneInfoNotFoundError:
            user_timezone = timezone.get_default_timezone()
        today = today or timezone.localdate(timezone=user_timezone)
        if period == GrowthDevelopmentReview.Period.WEEKLY:
            period_start = today - timedelta(days=today.weekday())
            period_end = min(period_start + timedelta(days=6), today)
        else:
            period_start = today.replace(day=1)
            period_end = today
        start_at = timezone.make_aware(datetime.combine(period_start, time.min), user_timezone)
        end_at = timezone.make_aware(datetime.combine(period_end + timedelta(days=1), time.min), user_timezone)
        events = GrowthEvidenceEvent.objects.filter(
            user=user, occurred_at__gte=start_at, occurred_at__lt=end_at,
        )
        milestones = GrowthMilestone.objects.filter(user=user, deleted_at__isnull=True)
        achieved_count = milestones.filter(
            status=GrowthMilestone.Status.ACHIEVED,
            achieved_at__gte=start_at,
            achieved_at__lt=end_at,
        ).count()
        active_count = milestones.filter(
            status__in=(GrowthMilestone.Status.PLANNED, GrowthMilestone.Status.IN_PROGRESS),
        ).count()
        pillar_activity = {}
        links = GrowthMilestoneEvidence.objects.filter(
            user=user,
            evidence_event__in=events,
            milestone__deleted_at__isnull=True,
        ).select_related("milestone")
        for link in links:
            pillar = link.milestone.pillar
            pillar_activity[pillar] = pillar_activity.get(pillar, 0) + 1
        review, _ = GrowthDevelopmentReview.objects.get_or_create(
            user=user,
            period=period,
            period_start=period_start,
            period_end=period_end,
            defaults={
                "evidence_count": events.count(),
                "achieved_milestone_count": achieved_count,
                "active_milestone_count": active_count,
                "pillar_activity": pillar_activity,
                "reflection": reflection,
                "next_steps": next_steps or [],
            },
        )
        return review
