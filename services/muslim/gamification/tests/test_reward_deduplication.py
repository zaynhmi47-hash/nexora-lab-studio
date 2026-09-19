from datetime import datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import GamificationEvent, GamificationEventType, RewardReason
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository


def test_non_repeatable_activity_cannot_be_rewarded_twice_with_new_event_id() -> None:
    repository = InMemoryPersistentXPLedgerRepository()
    service = XPRewardApplicationService(repository)
    occurred_at = datetime(2026, 9, 19, tzinfo=timezone.utc)

    first = service.process(
        GamificationEvent(
            event_id="attempt-1",
            user_id="user-1",
            event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
            occurred_at=occurred_at,
            activity_id="assessment-42",
        )
    )
    second = service.process(
        GamificationEvent(
            event_id="attempt-2",
            user_id="user-1",
            event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
            occurred_at=occurred_at,
            activity_id="assessment-42",
        )
    )

    assert first.awarded is True
    assert second.awarded is False
    assert second.reason is RewardReason.ALREADY_PROCESSED
    assert repository.get_balance("user-1").xp == 50


def test_non_repeatable_reward_key_is_scoped_per_user() -> None:
    repository = InMemoryPersistentXPLedgerRepository()
    service = XPRewardApplicationService(repository)

    first = service.process(
        GamificationEvent(
            event_id="assessment-user-1",
            user_id="user-1",
            event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
            occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
            activity_id="assessment-1",
        )
    )
    second = service.process(
        GamificationEvent(
            event_id="assessment-user-2",
            user_id="user-2",
            event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
            occurred_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
            activity_id="assessment-1",
        )
    )

    assert first.awarded is True
    assert second.awarded is True
