from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import GrowthGoal, GrowthJournalEntry


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
