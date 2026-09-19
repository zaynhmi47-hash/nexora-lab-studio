from datetime import date

from services.muslim.gamification.daily_reward import (
    DailyRewardState,
    claim_daily_reward,
)


def test_daily_reward_can_be_claimed_once_per_day() -> None:
    day = date(2026, 9, 19)

    state, first = claim_daily_reward(DailyRewardState(None), day)
    state, second = claim_daily_reward(state, day)

    assert first.granted is True
    assert first.xp == 30
    assert second.granted is False
    assert second.xp == 0
