from datetime import datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import GamificationEvent, GamificationEventType
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository


def test_processor_reads_state_from_server_repository() -> None:
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    processor = GamificationEventProcessor(
        XPRewardApplicationService(ledger),
        state,
    )

    result = processor.process(
        GamificationEvent(
            event_id="lesson-1",
            user_id="user-1",
            event_type=GamificationEventType.LESSON_COMPLETED,
            occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
            activity_id="lesson-1",
        )
    )

    persisted = state.get("user-1")
    assert result.snapshot.xp == 20
    assert persisted.xp == 20
    assert persisted.current_streak == 1
    assert "first_steps" in persisted.unlocked_achievement_keys
