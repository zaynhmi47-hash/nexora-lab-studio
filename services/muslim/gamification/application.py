from __future__ import annotations

from datetime import timezone
from uuid import uuid4

from .domain import GamificationEvent, RewardResult, XPLedgerEntry, RewardReason
from .policies import get_policy
from .repository import XPLedgerRepository


class XPRewardApplicationService:
    """Application boundary for an atomic, server-authoritative XP award."""

    def __init__(self, repository: XPLedgerRepository) -> None:
        self.repository = repository

    def process(self, event: GamificationEvent) -> RewardResult:
        policy = get_policy(event.event_type)

        existing = self.repository.get_by_event_id(event.event_id)
        if existing is not None:
            return RewardResult(
                awarded=False,
                xp=existing.amount,
                reason=RewardReason.ALREADY_PROCESSED,
                ledger_entry=existing,
            )

        reward_key = event.reward_key(repeatable=policy.repeatable)
        if not policy.repeatable:
            existing = self.repository.get_by_reward_key(reward_key)
            if existing is not None:
                return RewardResult(
                    awarded=False,
                    xp=existing.amount,
                    reason=RewardReason.ALREADY_PROCESSED,
                    ledger_entry=existing,
                )

        day = event.occurred_at.astimezone(timezone.utc).date()
        count = self.repository.count_events(
            user_id=event.user_id,
            event_type=event.event_type.value,
            day=day,
        )

        if policy.max_per_day is not None and count >= policy.max_per_day:
            return RewardResult(
                awarded=False,
                xp=0,
                reason=RewardReason.DAILY_LIMIT_REACHED,
            )

        entry = XPLedgerEntry(
            id=str(uuid4()),
            user_id=event.user_id,
            event_id=event.event_id,
            event_type=event.event_type,
            amount=policy.base_xp,
            created_at=event.occurred_at,
            activity_id=event.activity_id,
            metadata=event.metadata,
        )

        if not self.repository.append_if_absent(entry):
            # A concurrent request won the idempotency race.
            existing = self.repository.get_by_event_id(event.event_id)
            if existing is not None:
                return RewardResult(
                    awarded=False,
                    xp=existing.amount,
                    reason=RewardReason.ALREADY_PROCESSED,
                    ledger_entry=existing,
                )
            raise RuntimeError("XP ledger insert race could not be reconciled")

        return RewardResult(awarded=True, xp=entry.amount, ledger_entry=entry)
