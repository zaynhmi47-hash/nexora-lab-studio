from django.db import IntegrityError, transaction
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta

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


    @staticmethod
    def statistics(user: NexoraUser, days: int = 30) -> dict:
        days = min(max(days, 1), 90)
        since = timezone.now() - timedelta(days=days - 1)
        activities = GamificationActivity.objects.filter(
            user=user,
            deleted_at__isnull=True,
            occurred_at__gte=since,
        )
        total_xp = activities.aggregate(total=Sum("xp_earned"))["total"] or 0
        by_source = {
            source: activities.filter(source=source).aggregate(total=Sum("xp_earned"))["total"] or 0
            for source in (
                GamificationActivity.Source.LEARNING,
                GamificationActivity.Source.TAJWID,
                GamificationActivity.Source.ARABIC,
            )
        }
        daily = {}
        for activity in activities:
            key = timezone.localtime(activity.occurred_at).date().isoformat()
            daily[key] = daily.get(key, 0) + activity.xp_earned

        return {
            "days": days,
            "totalXp": total_xp,
            "activityCount": activities.count(),
            "bySource": by_source,
            "dailyXp": [
                {"date": date, "xp": xp}
                for date, xp in sorted(daily.items())
            ],
        }
