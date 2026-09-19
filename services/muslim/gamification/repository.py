from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from .domain import GamificationEvent, XPLedgerEntry


class XPLedgerRepository(ABC):
    """Persistence port. Implement with Django ORM/Firestore/etc. at the edge."""

    @abstractmethod
    def get_by_event_id(self, event_id: str) -> XPLedgerEntry | None:
        raise NotImplementedError

    @abstractmethod
    def count_events(
        self,
        *,
        user_id: str,
        event_type: str,
        day: date,
    ) -> int:
        raise NotImplementedError

    @abstractmethod
    def append_if_absent(self, entry: XPLedgerEntry) -> bool:
        """Atomically insert; return False when event_id already exists."""
        raise NotImplementedError
