from datetime import datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import GamificationEvent, GamificationEventType
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager


def build_processor():
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    return GamificationEventProcessor(
        XPRewardApplicationService(ledger),
        state,
        InMemoryGamificationTransactionManager(),
    ), state


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


def test_first_learning_activity_completes_daily_learning_quest() -> None:
    processor, state = build_processor()

    result = processor.process(make_event())

    quest = next(item for item in result.snapshot.quests if item.key == "daily_learn")
    assert quest.completed is True
    assert quest.reward_claimed is True
    assert any(bonus.xp == 25 and bonus.awarded for bonus in result.bonus_rewards)
    assert result.snapshot.xp == 45
    assert "daily_learn" in state.get("user-1").claimed_quest_keys


def test_seventh_activity_awards_streak_milestone_once() -> None:
    processor, state = build_processor()

    for index in range(7):
        event = make_event(f"lesson-{index}")
        processor.process(event)

    current = state.get("user-1")
    assert current.current_streak == 7
    assert 7 in current.rewarded_streak_milestones
    assert current.xp == 7 * 20 + 25 + 50

    processor.process(make_event("lesson-7"))
    current = state.get("user-1")
    assert current.xp == 8 * 20 + 25 + 50


def test_daily_reward_does_not_create_learning_streak() -> None:
    processor, state = build_processor()

    processor.process(
        GamificationEvent(
            event_id="daily-reward-1",
            user_id="user-1",
            event_type=GamificationEventType.DAILY_REWARD_CLAIMED,
            occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
            activity_id="2026-09-19",
        )
    )

    current = state.get("user-1")
    assert current.current_streak == 0
    assert current.xp == 30
