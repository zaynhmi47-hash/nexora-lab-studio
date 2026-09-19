from datetime import datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import GamificationEvent, GamificationEventType
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager


def build_processor():
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    return GamificationEventProcessor(XPRewardApplicationService(ledger), state), state


def make_event(event_id: str = "lesson-1") -> GamificationEvent:
    return GamificationEvent(
        event_id=event_id,
        user_id="user-1",
        event_type=GamificationEventType.LESSON_COMPLETED,
        occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
        activity_id=event_id,
    )


def test_processor_updates_xp_level_streak_and_achievements() -> None:
    processor, _ = build_processor()

    result = processor.process(make_event())

    assert result.reward.awarded is True
    assert result.snapshot.xp == 20
    assert result.snapshot.level == 1
    assert result.snapshot.streak.current == 1
    assert any(
        achievement.key == "first_steps"
        for achievement in result.snapshot.unlocked_achievements
    )


def test_duplicate_event_does_not_add_xp_or_streak_again() -> None:
    processor, state = build_processor()
    event = make_event()

    first = processor.process(event)
    second = processor.process(event)

    assert first.snapshot.xp == 20
    assert second.snapshot.xp == 20
    assert second.snapshot.streak.current == 1
    assert state.get("user-1").xp == 20
