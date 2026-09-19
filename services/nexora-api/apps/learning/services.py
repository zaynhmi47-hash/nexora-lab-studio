from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser
from apps.tajwid.services import TajwidService
from apps.arabic.services import ArabicService
from apps.tajwid.models import TajwidPracticeCompletion, TajwidTopicCompletion
from apps.arabic.models import ArabicLessonCompletion

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
    def achievement_catalog(cls) -> tuple[dict, ...]:
        return (
            {
                "key": "first-activity",
                "title": "First Activity",
                "description": "Complete your first activity in any learning domain.",
                "kind": "activity",
                "threshold": 1,
            },
            {
                "key": "streak-7",
                "title": "Seven Day Streak",
                "description": "Maintain a seven day learning streak.",
                "kind": "streak",
                "threshold": 7,
            },
            {
                "key": "xp-100",
                "title": "100 Total XP",
                "description": "Reach 100 XP across all learning domains.",
                "kind": "xp",
                "threshold": 100,
            },
            {
                "key": "tajwid-practice-10",
                "title": "Tajwid Practice",
                "description": "Complete 10 Tajwid practice items.",
                "kind": "tajwid_practice",
                "threshold": 10,
            },
            {
                "key": "arabic-lessons-5",
                "title": "Arabic Foundations",
                "description": "Complete 5 Arabic lessons.",
                "kind": "arabic_lessons",
                "threshold": 5,
            },
            {
                "key": "multi-domain",
                "title": "Multi-Domain Learner",
                "description": "Complete activities across all three learning domains.",
                "kind": "domains",
                "threshold": 3,
            },
        )

    @classmethod
    def achievement_snapshot(cls, user: NexoraUser) -> list[dict]:
        snapshot = cls.snapshot(user)
        activity_dates = cls._activity_dates(user)
        activity_count = (
            LearningLessonCompletion.objects.filter(user=user, deleted_at__isnull=True).count()
            + TajwidTopicCompletion.objects.filter(user=user, deleted_at__isnull=True).count()
            + TajwidPracticeCompletion.objects.filter(user=user, deleted_at__isnull=True).count()
            + ArabicLessonCompletion.objects.filter(user=user, deleted_at__isnull=True).count()
        )
        tajwid_practice_count = TajwidPracticeCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).count()
        arabic_lesson_count = ArabicLessonCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).count()
        domain_activity = sum(
            1
            for completed in (
                LearningLessonCompletion.objects.filter(user=user, deleted_at__isnull=True).exists(),
                TajwidTopicCompletion.objects.filter(user=user, deleted_at__isnull=True).exists()
                or TajwidPracticeCompletion.objects.filter(user=user, deleted_at__isnull=True).exists(),
                ArabicLessonCompletion.objects.filter(user=user, deleted_at__isnull=True).exists(),
            )
            if completed
        )

        latest_activity = max(activity_dates) if activity_dates else None
        earned = []
        for achievement in cls.achievement_catalog():
            kind = achievement["kind"]
            threshold = achievement["threshold"]
            is_earned = {
                "activity": activity_count >= threshold,
                "streak": snapshot["currentStreak"] >= threshold,
                "xp": snapshot["totalXp"] >= threshold,
                "tajwid_practice": tajwid_practice_count >= threshold,
                "arabic_lessons": arabic_lesson_count >= threshold,
                "domains": domain_activity >= threshold,
            }[kind]
            if is_earned:
                earned.append({
                    "id": achievement["key"],
                    "key": achievement["key"],
                    "title": achievement["title"],
                    "description": achievement["description"],
                    "earnedAt": latest_activity.isoformat() if latest_activity else timezone.now().isoformat(),
                })
        return earned

    @classmethod
    def rewards(cls, total_xp: int) -> list[dict]:
        return [
            {"key": key, "title": title, "description": description, "earned": total_xp >= threshold}
            for threshold, title, description in cls.REWARD_THRESHOLDS
            for key in [f"xp-{threshold}"]
        ]

    @classmethod
    def _activity_dates(cls, user: NexoraUser) -> set:
        dates = set()

        learning_dates = LearningLessonCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("completed_at", flat=True)
        tajwid_topic_dates = TajwidTopicCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("completed_at", flat=True)
        tajwid_practice_dates = TajwidPracticeCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("completed_at", flat=True)
        arabic_dates = ArabicLessonCompletion.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("completed_at", flat=True)

        for timestamp in (
            *learning_dates,
            *tajwid_topic_dates,
            *tajwid_practice_dates,
            *arabic_dates,
        ):
            dates.add(timezone.localtime(timestamp).date())

        return dates

    @classmethod
    def current_streak(cls, user: NexoraUser) -> int:
        dates = cls._activity_dates(user)
        if not dates:
            return 0

        today = timezone.localdate()
        if today not in dates:
            today -= timedelta(days=1)
            if today not in dates:
                return 0

        streak = 0
        cursor = today
        while cursor in dates:
            streak += 1
            cursor -= timedelta(days=1)
        return streak

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

        return {
            "userId": str(user.id),
            "totalXp": total_xp,
            **level_data,
            "currentStreak": cls.current_streak(user),
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
                "streak": engine["currentStreak"],
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