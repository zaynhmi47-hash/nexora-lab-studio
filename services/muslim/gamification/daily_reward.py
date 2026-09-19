from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class DailyRewardState:
    last_claim_date: date | None


@dataclass(frozen=True, slots=True)
class DailyRewardResult:
    granted: bool
    xp: int
    claim_date: date


def claim_daily_reward(
    state: DailyRewardState,
    claim_date: date,
    *,
    xp: int = 30,
) -> tuple[DailyRewardState, DailyRewardResult]:
    if state.last_claim_date == claim_date:
        return state, DailyRewardResult(
            granted=False,
            xp=0,
            claim_date=claim_date,
        )

    next_state = DailyRewardState(last_claim_date=claim_date)
    return next_state, DailyRewardResult(
        granted=True,
        xp=xp,
        claim_date=claim_date,
    )
