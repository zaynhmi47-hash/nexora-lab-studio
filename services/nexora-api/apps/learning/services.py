from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import (
    LearningCourse,
    LearningLesson,
    LearningLessonCompletion,
    LearningProgress,
    LearningQuizQuestion,
    LearningAchievement,
    LearningUserAchievement,
)


def level_for_xp(xp: int) -> int:
    return max(1, (xp // 50) + 1)


def _streak_after_completion(progress: LearningProgress, now):
    if progress.last_completed_at is None:
        return 1
    last_date = timezone.localtime(progress.last_completed_at).date()
    current_date = timezone.localtime(now).date()
    if current_date == last_date:
        return max(1, progress.current_streak)
    if current_date == last_date + timedelta(days=1):
        return progress.current_streak + 1
    return 1


class LearningService:
    @staticmethod
    def courses():
        return list(
            LearningCourse.objects.filter(is_published=True)
            .prefetch_related("lessons")
            .order_by("sort_order", "title")
        )

    @staticmethod
    def progress(user: NexoraUser) -> LearningProgress:
        progress, _ = LearningProgress.objects.get_or_create(user=user)
        return progress

    @staticmethod
    def completed_lesson_ids(user: NexoraUser) -> list[str]:
        return list(
            LearningLessonCompletion.objects.filter(user=user).values_list("lesson__key", flat=True)
        )

    @staticmethod
    def quiz(lesson_key: str):
        return list(
            LearningQuizQuestion.objects.filter(
                lesson__key=lesson_key,
                lesson__is_published=True,
                lesson__course__is_published=True,
            ).order_by("sort_order")
        )

    @staticmethod
    @transaction.atomic
    def complete_lesson(user: NexoraUser, lesson_key: str) -> LearningProgress:
        lesson = (
            LearningLesson.objects.select_for_update()
            .select_related("course")
            .filter(key=lesson_key, is_published=True, course__is_published=True)
            .first()
        )
        if lesson is None:
            raise LearningLesson.DoesNotExist

        completion, created = LearningLessonCompletion.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={"completed_at": timezone.now()},
        )
        progress = LearningProgress.objects.select_for_update().get_or_create(user=user)[0]
        if not created:
            return progress

        now = completion.completed_at
        progress.xp += lesson.xp_reward
        progress.level = level_for_xp(progress.xp)
        progress.current_streak = _streak_after_completion(progress, now)
        progress.last_completed_at = now
        progress.save(update_fields=["xp", "level", "current_streak", "last_completed_at", "updated_at"])
        return progress


    @staticmethod
    def achievements(user: NexoraUser):
        progress = LearningService.progress(user)
        completed = len(LearningService.completed_lesson_ids(user))
        eligible = LearningAchievement.objects.filter(
            is_published=True
        ).filter(
            xp_threshold__lte=progress.xp,
            streak_threshold__lte=progress.current_streak,
            lesson_threshold__lte=completed,
        )
        for achievement in eligible:
            LearningUserAchievement.objects.get_or_create(
                user=user,
                achievement=achievement,
                defaults={"earned_at": timezone.now()},
            )
        return LearningUserAchievement.objects.filter(
            user=user, deleted_at__isnull=True, achievement__is_published=True
        ).select_related("achievement").order_by("-earned_at")
