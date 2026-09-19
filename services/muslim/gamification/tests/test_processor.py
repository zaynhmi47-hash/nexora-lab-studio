from datetime import datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import GamificationEvent, GamificationEventType
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository
from services.muslim.gamification.streaks import StreakState


def test_processor_updates_xp_level_streak_and_achievements() -> None:
    repository = InMemoryPersistentXPLedgerRepository()
    processor = GamificationEventProcessor(
        XPRewardApplicationService(repository)
    )

    result = processor.process(
        GamificationEvent(
            event_id="lesson-1",
            user_id="user-1",
            event_type=GamificationEventType.LESSON_COMPLETED,
            occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
            activity_id="lesson-1",
        ),
        current_xp=0,
        current_streak=StreakState(0, 0, None),
    )

    assert result.reward.awarded is True
    assert result.snapshot.xp == 20
    assert result.snapshot.level == 1
    assert result.snapshot.streak.current == 1
    assert any(
        achievement.key == "first_steps"
        for achievement in result.snapshot.unlocked_achievements
    )


def test_duplicate_event_does_not_add_xp_again() -> None:
    repository = InMemoryPersistentXPLedgerRepository()
    processor = GamificationEventProcessor(
        XPRewardApplicationService(repository)
    )

    event = GamificationEvent(
        event_id="lesson-1",
        user_id="user-1",
        event_type=GamificationEventType.LESSON_COMPLETED,
        occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
        activity_id="lesson-1",
    )

    first = processor.process(
        event,
        current_xp=0,
        current_streak=StreakState(0, 0, None),
    )
    second = processor.process(
        event,
        current_xp=first.snapshot.xp,
        current_streak=first.snapshot.streak,
        already_unlocked=tuple(
            item.key for item in first.snapshot.unlocked_achievements
        ),
    )

    assert first.snapshot.xp == 20
    assert second.snapshot.xp == 20
