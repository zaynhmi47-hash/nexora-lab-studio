from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from threading import RLock

from .domain import GamificationEventType, XPLedgerEntry
from .repository import XPLedgerRepository


@dataclass(frozen=True, slots=True)
class XPBalanceRecord:
    user_id: str
    xp: int
    updated_at: datetime


class InMemoryPersistentXPLedgerRepository(XPLedgerRepository):
    """Deterministic reference adapter.

    The production adapter must map the same contract to the project's database
    and enforce a unique constraint on event_id inside a database transaction.
    """

    def __init__(self) -> None:
        self._entries: dict[str, XPLedgerEntry] = {}
        self._balances: dict[str, XPBalanceRecord] = {}
        self._lock = RLock()

    def get_by_event_id(self, event_id: str) -> XPLedgerEntry | None:
        with self._lock:
            return self._entries.get(event_id)

    def count_events(
        self,
        *,
        user_id: str,
        event_type: str,
        day: date,
    ) -> int:
        with self._lock:
            return sum(
                1
                for entry in self._entries.values()
                if entry.user_id == user_id
                and entry.event_type.value == event_type
                and entry.created_at.astimezone(timezone.utc).date() == day
            )

    def append_if_absent(self, entry: XPLedgerEntry) -> bool:
        with self._lock:
            if entry.event_id in self._entries:
                return False

            self._entries[entry.event_id] = entry
            current = self._balances.get(entry.user_id)
            previous_xp = current.xp if current else 0
            self._balances[entry.user_id] = XPBalanceRecord(
                user_id=entry.user_id,
                xp=previous_xp + entry.amount,
                updated_at=datetime.now(timezone.utc),
            )
            return True

    def get_balance(self, user_id: str) -> XPBalanceRecord:
        with self._lock:
            return self._balances.get(
                user_id,
                XPBalanceRecord(
                    user_id=user_id,
                    xp=0,
                    updated_at=datetime.now(timezone.utc),
                ),
            )
