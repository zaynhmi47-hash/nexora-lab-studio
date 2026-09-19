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
    @transaction.atomic
    def sync_from_domains(user: NexoraUser):
        """Ensure the activity ledger represents all active learning completions."""
        from apps.learning.models import LearningLessonCompletion
        from apps.tajwid.models import TajwidPracticeCompletion, TajwidTopicCompletion, TajwidProgress
        from apps.arabic.models import ArabicLessonCompletion

        for completion in LearningLessonCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).select_related("lesson"):
            GamificationService.record_activity(
                user=user,
                source=GamificationActivity.Source.LEARNING,
                action="lesson_completed",
                source_key=completion.lesson.key,
                xp_earned=completion.lesson.xp_reward,
                occurred_at=completion.completed_at,
            )

        for completion in TajwidPracticeCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).select_related("practice_item"):
            # A completed practice is an activity even when the answer awarded 0 XP.
            existing = GamificationActivity.objects.filter(
                user=user,
                source=GamificationActivity.Source.TAJWID,
                action="practice_completed",
                source_key=completion.practice_item.key,
            ).first()
            if existing is None:
                GamificationService.record_activity(
                    user=user,
                    source=GamificationActivity.Source.TAJWID,
                    action="practice_completed",
                    source_key=completion.practice_item.key,
                    xp_earned=0,
                    occurred_at=completion.completed_at,
                )

        for completion in TajwidTopicCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).select_related("topic"):
            GamificationService.record_activity(
                user=user,
                source=GamificationActivity.Source.TAJWID,
                action="topic_completed",
                source_key=completion.topic.key,
                xp_earned=completion.topic.xp_reward,
                occurred_at=completion.completed_at,
            )

        tajwid_progress = TajwidProgress.objects.filter(user=user, deleted_at__isnull=True).first()
        if tajwid_progress and tajwid_progress.assessment_completed:
            GamificationService.record_activity(
                user=user,
                source=GamificationActivity.Source.TAJWID,
                action="assessment_completed",
                source_key="tajwid-assessment-pass",
                xp_earned=100,
                occurred_at=tajwid_progress.updated_at,
            )

        for completion in ArabicLessonCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).select_related("lesson"):
            GamificationService.record_activity(
                user=user,
                source=GamificationActivity.Source.ARABIC,
                action="lesson_completed",
                source_key=completion.lesson.key,
                xp_earned=completion.lesson.xp_reward,
                occurred_at=completion.completed_at,
            )

    @staticmethod
    @transaction.atomic
    def record_milestone(user: NexoraUser, key: str, occurred_at=None) -> GamificationActivity:
        return GamificationService.record_activity(
            user=user,
            source=GamificationActivity.Source.GAMIFICATION,
            action="milestone_unlocked",
            source_key=key,
            xp_earned=0,
            occurred_at=occurred_at or timezone.now(),
        )

    @staticmethod
    @transaction.atomic
    def sync_milestones(user: NexoraUser):
        from apps.learning.services import UnifiedLearningEngine

        UnifiedLearningEngine.achievement_snapshot(user)

    @staticmethod
    def list_recent(user: NexoraUser, limit: int = 50):
        GamificationService.sync_from_domains(user)
        GamificationService.sync_milestones(user)
        limit = min(max(limit, 1), 100)
        return GamificationActivity.objects.filter(
            user=user,
            deleted_at__isnull=True,
        ).order_by("-occurred_at")[:limit]

    @staticmethod
    def statistics(user: NexoraUser, days: int = 30) -> dict:
        GamificationService.sync_from_domains(user)
        GamificationService.sync_milestones(user)
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
                GamificationActivity.Source.GAMIFICATION,
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
