from datetime import datetime, timezone

from services.muslim.gamification.domain import GamificationEvent, GamificationEventType, RewardReason
from services.muslim.gamification.service import InMemoryXPLedger, XPRewardService


def make_event(event_id: str, event_type: GamificationEventType) -> GamificationEvent:
    return GamificationEvent(
        event_id=event_id,
        user_id="user-1",
        event_type=event_type,
        occurred_at=datetime(2026, 9, 19, 10, 0, tzinfo=timezone.utc),
    )


def test_duplicate_event_is_idempotent() -> None:
    service = XPRewardService(InMemoryXPLedger())
    event = make_event("event-1", GamificationEventType.TAJWID_ASSESSMENT_COMPLETED)

    first = service.award(event)
    second = service.award(event)

    assert first.awarded is True
    assert first.xp == 50
    assert second.awarded is False
    assert second.reason == RewardReason.ALREADY_PROCESSED
    assert second.xp == 50


def test_daily_limit_is_enforced() -> None:
    service = XPRewardService(InMemoryXPLedger())

    for index in range(10):
        result = service.award(
            make_event(
                f"practice-{index}",
                GamificationEventType.TAJWID_PRACTICE_COMPLETED,
            )
        )
        assert result.awarded is True

    blocked = service.award(
        make_event("practice-10", GamificationEventType.TAJWID_PRACTICE_COMPLETED)
    )

    assert blocked.awarded is False
    assert blocked.xp == 0
    assert blocked.reason == RewardReason.DAILY_LIMIT_REACHED


def test_different_events_are_independent() -> None:
    service = XPRewardService(InMemoryXPLedger())

    lesson = service.award(
        make_event("lesson-1", GamificationEventType.LESSON_COMPLETED)
    )
    quiz = service.award(
        make_event("quiz-1", GamificationEventType.QUIZ_COMPLETED)
    )

    assert lesson.xp == 20
    assert quiz.xp == 15
    assert len(service.ledger.entries) == 2
