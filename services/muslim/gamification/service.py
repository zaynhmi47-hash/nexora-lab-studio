from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timezone
from uuid import uuid4

from .domain import (
    GamificationEvent,
    RewardReason,
    RewardResult,
    XPLedgerEntry,
)
from .policies import get_policy


@dataclass(slots=True)
class InMemoryXPLedger:
    """Reference implementation; production adapters should persist this atomically."""

    entries: list[XPLedgerEntry]

    def __init__(self) -> None:
        self.entries = []

    def find_event(self, event_id: str) -> XPLedgerEntry | None:
        return next((item for item in self.entries if item.event_id == event_id), None)

    def count_events_today(self, user_id: str, event_type: str, day: date) -> int:
        return sum(
            1
            for item in self.entries
            if item.user_id == user_id
            and item.event_type == event_type
            and item.created_at.astimezone(timezone.utc).date() == day
        )

    def append(self, entry: XPLedgerEntry) -> None:
        if self.find_event(entry.event_id) is not None:
            raise ValueError("event_id already exists")
        self.entries.append(entry)


class XPRewardService:
    def __init__(self, ledger: InMemoryXPLedger) -> None:
        self.ledger = ledger

    def award(self, event: GamificationEvent) -> RewardResult:
        policy = get_policy(event.event_type)

        existing = self.ledger.find_event(event.event_id)
        if existing is not None:
            return RewardResult(
                awarded=False,
                xp=existing.amount,
                reason=RewardReason.ALREADY_PROCESSED,
                ledger_entry=existing,
            )

        today_count = self.ledger.count_events_today(
            event.user_id,
            event.event_type,
            event.occurred_at.astimezone(timezone.utc).date(),
        )

        if policy.max_per_day is not None and today_count >= policy.max_per_day:
            return RewardResult(
                awarded=False,
                xp=0,
                reason=RewardReason.DAILY_LIMIT_REACHED,
            )

        # Non-repeatable events are keyed by event_id. Callers should generate
        # a stable event_id for the logical completion/attempt.
        entry = XPLedgerEntry(
            id=str(uuid4()),
            user_id=event.user_id,
            event_id=event.event_id,
            event_type=event.event_type,
            amount=policy.base_xp,
            created_at=datetime.now(timezone.utc),
            activity_id=event.activity_id,
            metadata=event.metadata,
        )
        self.ledger.append(entry)
        return RewardResult(awarded=True, xp=entry.amount, ledger_entry=entry)
