from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser
from apps.tajwid.services import TajwidService
from apps.arabic.services import ArabicService

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


class UnifiedLearningEngine:
    XP_PER_LEVEL = 50
    REWARD_THRESHOLDS = (
        (100, "Learning Momentum", "Reach 100 total learning XP."),
        (250, "Dedicated Learner", "Reach 250 total learning XP."),
        (500, "Learning Mastery", "Reach 500 total learning XP."),
    )

    @classmethod
    def level(cls, total_xp: int) -> int:
        return max(1, (total_xp // cls.XP_PER_LEVEL) + 1)

    @classmethod
    def level_progress(cls, total_xp: int) -> dict:
        level = cls.level(total_xp)
        current = total_xp % cls.XP_PER_LEVEL
        return {
            "level": level,
            "xpIntoLevel": current,
            "xpToNextLevel": cls.XP_PER_LEVEL - current if current else cls.XP_PER_LEVEL,
            "xpPerLevel": cls.XP_PER_LEVEL,
            "progressPercent": round((current / cls.XP_PER_LEVEL) * 100),
        }

    @classmethod
    def rewards(cls, total_xp: int) -> list[dict]:
        return [
            {"key": key, "title": title, "description": description, "earned": total_xp >= threshold}
            for threshold, title, description in cls.REWARD_THRESHOLDS
            for key in [f"xp-{threshold}"]
        ]

    @classmethod
    def snapshot(cls, user: NexoraUser) -> dict:
        learning = LearningService.progress(user)
        tajwid = TajwidService.progress(user)
        arabic = ArabicService.progress(user)

        domains = {
            "learning": learning.xp,
            "tajwid": tajwid["xpEarned"],
            "arabic": arabic["xpEarned"],
        }
        total_xp = sum(domains.values())
        level_data = cls.level_progress(total_xp)

        streaks = [
            learning.current_streak,
            tajwid.get("currentStreak", 0),
            arabic.get("currentStreak", 0),
        ]

        return {
            "userId": str(user.id),
            "totalXp": total_xp,
            **level_data,
            "currentStreak": max(streaks),
            "domains": domains,
            "rewards": cls.rewards(total_xp),
        }


def learning_hub(user: NexoraUser):
    learning = LearningService.progress(user)
    tajwid = TajwidService.progress(user)
    arabic = ArabicService.progress(user)
    engine = UnifiedLearningEngine.snapshot(user)

    return {
        **engine,
        "domains": {
            "learning": {
                "xp": learning.xp,
                "level": learning.level,
                "streak": learning.current_streak,
                "completedCount": len(LearningService.completed_lesson_ids(user)),
            },
            "tajwid": {
                "xp": tajwid["xpEarned"],
                "streak": tajwid.get("currentStreak", 0),
                "completedCount": len(tajwid["completedTopicIds"]),
                "practiceCompleted": tajwid["practiceCompleted"],
                "assessmentCompleted": tajwid["assessmentCompleted"],
            },
            "arabic": {
                "xp": arabic["xpEarned"],
                "streak": arabic["currentStreak"],
                "completedCount": len(arabic["completedLessonIds"]),
            },
        },
    }
\n