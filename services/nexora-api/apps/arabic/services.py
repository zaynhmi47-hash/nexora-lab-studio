from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser
from apps.gamification.services import GamificationService

from .models import ArabicLesson, ArabicLessonCompletion, ArabicPath, ArabicProgress, ArabicPracticeItem


class ArabicService:
    @staticmethod
    def paths(user: NexoraUser):
        completed = set(ArabicLessonCompletion.objects.filter(user=user).values_list("lesson__key", flat=True))
        result = []
        for path in ArabicPath.objects.filter(is_published=True).prefetch_related("lessons"):
            lessons = []
            for lesson in path.lessons.filter(is_published=True):
                status = "completed" if lesson.key in completed else "available"
                if status != "completed" and lessons and lessons[-1]["status"] != "completed":
                    status = "locked"
                lessons.append({"id": lesson.key, "pathId": path.key, "title": lesson.title, "description": lesson.description, "kind": lesson.kind, "order": lesson.sort_order, "xpReward": lesson.xp_reward, "status": status})
            result.append({"id": path.key, "title": path.title, "description": path.description, "lessons": lessons})
        return result

    @staticmethod
    def progress(user: NexoraUser):
        progress, _ = ArabicProgress.objects.get_or_create(user=user)
        completed = list(ArabicLessonCompletion.objects.filter(user=user).values_list("lesson__key", flat=True))
        return {"userId": str(user.id), "xpEarned": progress.xp_earned, "currentStreak": progress.current_streak, "completedLessonIds": completed, "lastCompletedAt": progress.last_completed_at.isoformat() if progress.last_completed_at else None}

    @staticmethod
    def practice(lesson_key: str):
        return list(ArabicPracticeItem.objects.filter(lesson__key=lesson_key, lesson__is_published=True, lesson__path__is_published=True).order_by("sort_order"))

    @staticmethod
    @transaction.atomic
    def complete_lesson(user: NexoraUser, lesson_key: str):
        lesson = ArabicLesson.objects.select_for_update().filter(key=lesson_key, is_published=True, path__is_published=True).first()
        if lesson is None:
            raise ArabicLesson.DoesNotExist
        completion, created = ArabicLessonCompletion.objects.get_or_create(user=user, lesson=lesson, defaults={"completed_at": timezone.now()})
        if not created and completion.deleted_at is not None:
            completion.deleted_at = None
            completion.completed_at = timezone.now()
            completion.save(update_fields=["deleted_at", "completed_at", "updated_at"])
            created = True

        progress, _ = ArabicProgress.objects.select_for_update().get_or_create(user=user)
        if not created:
            return ArabicService.progress(user)
        now = completion.completed_at
        if progress.last_completed_at is None:
            streak = 1
        else:
            last = timezone.localtime(progress.last_completed_at).date()
            today = timezone.localtime(now).date()
            streak = progress.current_streak if today == last else progress.current_streak + 1 if today == last + timedelta(days=1) else 1
        progress.xp_earned += lesson.xp_reward
        progress.current_streak = streak
        progress.last_completed_at = now
        progress.save(update_fields=["xp_earned", "current_streak", "last_completed_at", "updated_at"])
        GamificationService.record_activity(
            user=user,
            source="arabic",
            action="lesson_completed",
            source_key=lesson.key,
            xp_earned=lesson.xp_reward,
            occurred_at=now,
        )
        return ArabicService.progress(user)
