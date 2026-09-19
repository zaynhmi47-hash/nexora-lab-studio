from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Mapping

from .achievements import AchievementDefinition, unlocked_achievements
from .application import XPRewardApplicationService
from .domain import GamificationEvent, RewardResult
from .leveling import level_for_xp
from .streaks import StreakState, apply_daily_activity


@dataclass(frozen=True, slots=True)
class GamificationSnapshot:
    xp: int
    level: int
    streak: StreakState
    unlocked_achievements: tuple[AchievementDefinition, ...]


@dataclass(frozen=True, slots=True)
class GamificationProcessResult:
    reward: RewardResult
    snapshot: GamificationSnapshot


class GamificationEventProcessor:
    """Coordinates the gamification domain after an accepted learning event.

    XP remains server-authoritative through XPRewardApplicationService.
    Streak and achievement state are supplied by callers until a persistent
    user-progress repository is connected.
    """

    def __init__(self, reward_service: XPRewardApplicationService) -> None:
        self.reward_service = reward_service

    def process(
        self,
        event: GamificationEvent,
        *,
        current_xp: int,
        current_streak: StreakState,
        already_unlocked: tuple[str, ...] = (),
        activity_date: date | None = None,
    ) -> GamificationProcessResult:
        reward = self.reward_service.process(event)

        next_xp = current_xp + reward.xp if reward.awarded else current_xp
        next_streak = apply_daily_activity(
            current_streak,
            activity_date or event.occurred_at.astimezone(timezone.utc).date(),
        )

        new_achievements = tuple(
            unlocked_achievements(
                xp=next_xp,
                streak=next_streak.current,
                already_unlocked=already_unlocked,
            )
        )

        return GamificationProcessResult(
            reward=reward,
            snapshot=GamificationSnapshot(
                xp=next_xp,
                level=level_for_xp(next_xp),
                streak=next_streak,
                unlocked_achievements=new_achievements,
            ),
        )
