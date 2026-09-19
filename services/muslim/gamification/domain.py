from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from typing import Mapping


class GamificationEventType(StrEnum):
    LESSON_COMPLETED = "LESSON_COMPLETED"
    QUIZ_COMPLETED = "QUIZ_COMPLETED"
    TAJWID_PRACTICE_COMPLETED = "TAJWID_PRACTICE_COMPLETED"
    TAJWID_ASSESSMENT_COMPLETED = "TAJWID_ASSESSMENT_COMPLETED"
    ARABIC_LESSON_COMPLETED = "ARABIC_LESSON_COMPLETED"
    DAILY_ACTIVITY_COMPLETED = "DAILY_ACTIVITY_COMPLETED"
    STREAK_MILESTONE = "STREAK_MILESTONE"
    DAILY_REWARD_CLAIMED = "DAILY_REWARD_CLAIMED"


class RewardReason(StrEnum):
    ALREADY_PROCESSED = "ALREADY_PROCESSED"
    DAILY_LIMIT_REACHED = "DAILY_LIMIT_REACHED"
    ACTIVITY_NOT_ELIGIBLE = "ACTIVITY_NOT_ELIGIBLE"
    COOLDOWN_ACTIVE = "COOLDOWN_ACTIVE"


@dataclass(frozen=True, slots=True)
class RewardPolicy:
    event_type: GamificationEventType
    base_xp: int
    repeatable: bool
    max_per_day: int | None = None
    cooldown_seconds: int | None = None


@dataclass(frozen=True, slots=True)
class GamificationEvent:
    event_id: str
    user_id: str
    event_type: GamificationEventType
    occurred_at: datetime
    activity_id: str | None = None
    metadata: Mapping[str, object] | None = None

    def reward_key(self, *, repeatable: bool) -> str:
        if repeatable:
            return f"event:{self.event_id}"
        if self.event_type is GamificationEventType.STREAK_MILESTONE:
            milestone = (self.metadata or {}).get("milestone")
            if milestone is None:
                raise ValueError("streak milestone requires metadata.milestone")
            return f"milestone:{self.event_type.value}:{milestone}"
        if not self.activity_id:
            raise ValueError("non-repeatable event requires activity_id")
        return f"activity:{self.event_type.value}:{self.activity_id}"


@dataclass(frozen=True, slots=True)
class XPLedgerEntry:
    id: str
    user_id: str
    event_id: str
    event_type: GamificationEventType
    amount: int
    created_at: datetime
    activity_id: str | None = None
    metadata: Mapping[str, object] | None = None


@dataclass(frozen=True, slots=True)
class RewardResult:
    awarded: bool
    xp: int
    reason: RewardReason | None = None
    ledger_entry: XPLedgerEntry | None = None


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
