from django.test import TestCase

from apps.identity.models import NexoraUser

from .models import GamificationActivity
from .services import GamificationService, XPRewardRules


class GamificationServiceTests(TestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create()

    def test_record_activity_is_idempotent(self):
        first = GamificationService.record_activity(
            user=self.user,
            source=GamificationActivity.Source.LEARNING,
            action="lesson_completed",
            source_key="lesson-1",
            xp_earned=20,
        )
        second = GamificationService.record_activity(
            user=self.user,
            source=GamificationActivity.Source.LEARNING,
            action="lesson_completed",
            source_key="lesson-1",
            xp_earned=999,
        )
        self.assertEqual(first.id, second.id)
        self.assertEqual(GamificationActivity.objects.filter(user=self.user).count(), 1)
        self.assertEqual(second.xp_earned, 20)

    def test_negative_xp_is_clamped(self):
        activity = GamificationService.record_activity(
            user=self.user,
            source=GamificationActivity.Source.GAMIFICATION,
            action="test",
            source_key="negative-xp",
            xp_earned=-10,
        )
        self.assertEqual(activity.xp_earned, 0)

    def test_daily_reward_is_idempotent_for_current_day(self):
        first, first_claimed = GamificationService.claim_daily_reward(self.user)
        second, second_claimed = GamificationService.claim_daily_reward(self.user)
        self.assertEqual(first.id, second.id)
        self.assertTrue(first_claimed)
        self.assertFalse(second_claimed)
        self.assertEqual(first.xp_earned, 10)
        self.assertEqual(second.xp_earned, 10)
        self.assertEqual(
            GamificationActivity.objects.filter(
                user=self.user,
                action="daily_reward",
            ).count(),
            1,
        )

    def test_xp_rules_do_not_award_failed_quiz(self):
        self.assertEqual(XPRewardRules.quiz(False, configured_reward=50), 0)
        self.assertEqual(XPRewardRules.tajwid_practice(False), 0)
        self.assertEqual(XPRewardRules.tajwid_assessment(False), 0)


    def test_unified_snapshot_does_not_recurse_through_achievements(self):
        from apps.learning.services import UnifiedLearningEngine

        snapshot = UnifiedLearningEngine.snapshot(self.user)
        self.assertEqual(snapshot["totalXp"], 0)
        self.assertEqual(snapshot["achievements"], [])

    def test_daily_reward_contributes_to_unified_xp(self):
        from apps.learning.services import UnifiedLearningEngine

        GamificationService.claim_daily_reward(self.user)
        snapshot = UnifiedLearningEngine.snapshot(self.user)
        self.assertEqual(snapshot["domains"]["gamification"], 10)
        self.assertEqual(snapshot["totalXp"], 10)
        self.assertEqual(snapshot["level"], 1)


    def test_current_streak_ignores_deleted_completions_and_requires_contiguous_days(self):
        from datetime import timedelta
        from apps.learning.services import UnifiedLearningEngine

        course = LearningCourse.objects.create(key="streak-course", title="Streak Course")
        lessons = [
            LearningLesson.objects.create(
                key=f"streak-lesson-{index}",
                course=course,
                title=f"Lesson {index}",
            )
            for index in range(3)
        ]
        for lesson, offset in zip(lessons, (2, 1, 0)):
            LearningLessonCompletion.objects.create(
                user=self.user,
                lesson=lesson,
                completed_at=timezone.now() - timedelta(days=offset),
            )

        self.assertEqual(UnifiedLearningEngine.current_streak(self.user), 3)

        gap_lesson = LearningLesson.objects.create(
            key="streak-gap",
            course=course,
            title="Gap",
        )
        LearningLessonCompletion.objects.create(
            user=self.user,
            lesson=gap_lesson,
            completed_at=timezone.now() - timedelta(days=5),
        )
        self.assertEqual(UnifiedLearningEngine.current_streak(self.user), 3)

        lessons[1].completions.filter(user=self.user).update(deleted_at=timezone.now())
        self.assertEqual(UnifiedLearningEngine.current_streak(self.user), 1)
