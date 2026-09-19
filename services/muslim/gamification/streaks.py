from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True, slots=True)
class StreakState:
    current: int
    longest: int
    last_activity_date: date | None


def apply_daily_activity(
    state: StreakState,
    activity_date: date,
) -> StreakState:
    if state.last_activity_date == activity_date:
        return state

    if state.last_activity_date == activity_date - timedelta(days=1):
        current = state.current + 1
    else:
        current = 1

    return StreakState(
        current=current,
        longest=max(state.longest, current),
        last_activity_date=activity_date,
    )
