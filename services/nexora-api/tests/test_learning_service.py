from datetime import timedelta

import pytest
from django.utils import timezone

from apps.identity.models import NexoraUser
from apps.learning.models import LearningLessonCompletion
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
