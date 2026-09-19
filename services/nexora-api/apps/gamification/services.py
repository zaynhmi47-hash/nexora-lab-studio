from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import GamificationActivity


class GamificationService:
    @staticmethod
    @transaction.atomic
    def record_activity(
        user: NexoraUser,
        source: str,
        action: str,
        source_key: str,
        xp_earned: int = 0,
        occurred_at=None,
    ) -> GamificationActivity:
        occurred_at = occurred_at or timezone.now()
        activity, created = GamificationActivity.objects.get_or_create(
            user=user,
            source=source,
            action=action,
            source_key=source_key,
            defaults={
                "xp_earned": max(0, xp_earned),
                "occurred_at": occurred_at,
            },
        )
        if not created and activity.deleted_at is not None:
            activity.deleted_at = None
            activity.xp_earned = max(0, xp_earned)
            activity.occurred_at = occurred_at
            activity.save(update_fields=["deleted_at", "xp_earned", "occurred_at", "updated_at"])
        return activity

    @staticmethod
    def list_recent(user: NexoraUser, limit: int = 50):
        limit = min(max(limit, 1), 100)
        return GamificationActivity.objects.filter(
            user=user,
            deleted_at__isnull=True,
        ).order_by("-occurred_at")[:limit]
