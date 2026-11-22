from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from datetime import timedelta

from .models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn, GrowthJournalEntry


class GrowthService:
    @staticmethod
    @transaction.atomic
    def create_goal(*, user, **data):
        goal = GrowthGoal(user=user, **data)
        goal.full_clean()
        goal.save()
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
        if changes.get("status") == GrowthGoal.Status.COMPLETED:
            changes["completed_at"] = timezone.now()
        elif changes.get("status") in (GrowthGoal.Status.ACTIVE, GrowthGoal.Status.PAUSED):
            changes["completed_at"] = None
        for field, value in changes.items():
            setattr(goal, field, value)
        goal.full_clean()
        goal.save()
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
        check_in = GrowthHabitCheckIn.objects.filter(
            habit=habit,
            entry_date=entry_date,
            deleted_at__isnull=True,
        ).first()
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
        return check_in

    @staticmethod
    def habit_summary(*, user, habit, today=None):
        today = today or timezone.localdate()
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
        if habit.frequency == GrowthHabit.Frequency.DAILY:
            expected_date = today
            if latest and latest.entry_date == today and latest.status == GrowthHabitCheckIn.Status.SKIPPED:
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
