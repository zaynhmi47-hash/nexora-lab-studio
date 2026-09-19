from datetime import date

from services.muslim.gamification.streaks import StreakState, apply_daily_activity


def test_first_activity_starts_streak() -> None:
    state = apply_daily_activity(
        StreakState(0, 0, None),
        date(2026, 9, 19),
    )

    assert state.current == 1
    assert state.longest == 1


def test_consecutive_activity_extends_streak() -> None:
    state = StreakState(1, 1, date(2026, 9, 19))
    state = apply_daily_activity(state, date(2026, 9, 20))

    assert state.current == 2
    assert state.longest == 2


def test_same_day_is_idempotent() -> None:
    state = StreakState(3, 3, date(2026, 9, 19))
    result = apply_daily_activity(state, date(2026, 9, 19))

    assert result == state
