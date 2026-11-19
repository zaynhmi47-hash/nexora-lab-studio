from datetime import timedelta

import pytest
from django.utils import timezone

from apps.identity.models import NexoraUser
from apps.learning.models import (
    LearningCourse,
    LearningLesson,
    LearningLessonCompletion,
    LearningQuizQuestion,
)
from apps.learning.services import LearningService, level_for_xp


@pytest.fixture
def user(db):
    return NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="learner@example.com")


@pytest.mark.django_db
def test_progress_is_created_for_internal_nexora_user(user):
    progress = LearningService.progress(user)
    assert progress.user_id == user.id
    assert progress.xp == 0
    assert progress.level == 1


@pytest.mark.django_db
def test_complete_lesson_is_idempotent(user):
    first = LearningService.complete_lesson(user, "arabic-alphabet")
    second = LearningService.complete_lesson(user, "arabic-alphabet")

    assert first.id == second.id
    assert second.xp == 20
    assert LearningLessonCompletion.objects.filter(user=user, lesson__key="arabic-alphabet").count() == 1


@pytest.mark.django_db
def test_complete_lesson_awards_xp_and_streak(user):
    progress = LearningService.complete_lesson(user, "arabic-alphabet")
    assert progress.xp == 20
    assert progress.level == level_for_xp(20)
    assert progress.current_streak == 1
    assert progress.last_completed_at is not None


@pytest.mark.django_db
def test_completion_is_isolated_per_user(user):
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="other@example.com")
    LearningService.complete_lesson(user, "arabic-alphabet")
    progress = LearningService.progress(other)

    assert progress.xp == 0
    assert LearningService.completed_lesson_ids(other) == []


@pytest.mark.django_db
def test_streak_increments_on_next_day(user):
    progress = LearningService.complete_lesson(user, "arabic-alphabet")
    progress.last_completed_at = timezone.now() - timedelta(days=1)
    progress.current_streak = 2
    progress.save(update_fields=["last_completed_at", "current_streak", "updated_at"])

    result = LearningService.complete_lesson(user, "harakat")
    assert result.current_streak == 3



@pytest.mark.django_db
def test_lesson_cannot_be_completed_before_previous_published_lesson(user):
    course = LearningCourse.objects.create(key="sequence-course", title="Sequence")
    first = LearningLesson.objects.create(
        key="sequence-first", course=course, title="First", sort_order=1
    )
    second = LearningLesson.objects.create(
        key="sequence-second", course=course, title="Second", sort_order=2
    )

    with pytest.raises(ValueError, match="previous lessons"):
        LearningService.complete_lesson(user, second.key)

    LearningService.complete_lesson(user, first.key)
    progress = LearningService.complete_lesson(user, second.key)
    assert progress.xp == first.xp_reward + second.xp_reward


@pytest.mark.django_db
def test_quiz_rejects_answer_index_outside_question_options(user):
    course = LearningCourse.objects.create(key="range-course", title="Range")
    lesson = LearningLesson.objects.create(
        key="range-quiz", course=course, title="Range quiz",
        kind=LearningLesson.Kind.QUIZ,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson, key="range-question", prompt="Choose",
        options=["A", "B"], correct_option_index=1,
    )

    with pytest.raises(ValueError, match="outside the available choices"):
        LearningService.complete_quiz(user, lesson.key, [2])


@pytest.mark.django_db
def test_quiz_lesson_requires_a_passed_attempt_before_completion(user):
    course = LearningCourse.objects.create(key="gate-course", title="Gate")
    lesson = LearningLesson.objects.create(
        key="gate-quiz", course=course, title="Gate quiz",
        kind=LearningLesson.Kind.QUIZ,
    )

    with pytest.raises(ValueError, match="Pass the quiz"):
        LearningService.complete_lesson(user, lesson.key)

    LearningQuizQuestion.objects.create(
        lesson=lesson, key="gate-question", prompt="Choose",
        options=["A", "B"], correct_option_index=0,
    )
    result = LearningService.complete_quiz(user, lesson.key, [0])
    assert result["passed"] is True
    progress = LearningService.complete_lesson(user, lesson.key)
    assert progress.xp == lesson.xp_reward
