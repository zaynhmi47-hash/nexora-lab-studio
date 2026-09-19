from datetime import date, datetime, timezone

from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.domain import (
    GamificationEvent,
    GamificationEventType,
    XPLedgerEntry,
)
from services.muslim.gamification.repository import XPLedgerRepository


class FakeRepository(XPLedgerRepository):
    def __init__(self) -> None:
        self.entries: list[XPLedgerEntry] = []

    def get_by_event_id(self, event_id: str) -> XPLedgerEntry | None:
        return next((x for x in self.entries if x.event_id == event_id), None)

    def count_events(self, *, user_id: str, event_type: str, day: date) -> int:
        return sum(
            x.user_id == user_id
            and x.event_type.value == event_type
            and x.created_at.astimezone(timezone.utc).date() == day
            for x in self.entries
        )

    def append_if_absent(self, entry: XPLedgerEntry) -> bool:
        if self.get_by_event_id(entry.event_id):
            return False
        self.entries.append(entry)
        return True


def event(event_id: str) -> GamificationEvent:
    return GamificationEvent(
        event_id=event_id,
        user_id="user-1",
        event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
        occurred_at=datetime(2026, 9, 19, 10, 0, tzinfo=timezone.utc),
    )


def test_application_service_is_idempotent() -> None:
    repo = FakeRepository()
    service = XPRewardApplicationService(repo)

    first = service.process(event("assessment-1"))
    second = service.process(event("assessment-1"))

    assert first.awarded is True
    assert first.xp == 50
    assert second.awarded is False
    assert second.xp == 50
    assert len(repo.entries) == 1


def test_concurrent_insert_winner_is_not_double_rewarded() -> None:
    repo = FakeRepository()
    service = XPRewardApplicationService(repo)

    first = service.process(event("assessment-2"))
    assert first.awarded is True

    duplicate = service.process(event("assessment-2"))
    assert duplicate.awarded is False
    assert duplicate.xp == 50
