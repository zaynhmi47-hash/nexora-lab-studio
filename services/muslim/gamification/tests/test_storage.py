from datetime import datetime, timezone

from services.muslim.gamification.domain import GamificationEventType, XPLedgerEntry
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository


def entry(event_id: str, amount: int = 50) -> XPLedgerEntry:
    return XPLedgerEntry(
        id=event_id,
        user_id="user-1",
        event_id=event_id,
        event_type=GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
        amount=amount,
        created_at=datetime(2026, 9, 19, 10, 0, tzinfo=timezone.utc),
    )


def test_append_updates_balance_once() -> None:
    repo = InMemoryPersistentXPLedgerRepository()

    assert repo.append_if_absent(entry("e1")) is True
    assert repo.append_if_absent(entry("e1")) is False
    assert repo.get_balance("user-1").xp == 50


def test_balance_isolated_per_user() -> None:
    repo = InMemoryPersistentXPLedgerRepository()

    first = entry("e1")
    second = XPLedgerEntry(
        id="e2",
        user_id="user-2",
        event_id="e2",
        event_type=first.event_type,
        amount=20,
        created_at=first.created_at,
    )

    repo.append_if_absent(first)
    repo.append_if_absent(second)

    assert repo.get_balance("user-1").xp == 50
    assert repo.get_balance("user-2").xp == 20
