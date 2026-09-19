from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timezone

from .achievements import AchievementDefinition, unlocked_achievements
from .application import XPRewardApplicationService
from .domain import GamificationEvent, RewardReason, RewardResult
from .leveling import level_for_xp
from .state_repository import GamificationStateRepository
from .streaks import StreakState, apply_daily_activity
from .transaction import GamificationTransactionManager


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
    """Coordinates server-owned gamification state inside one transaction."""

    def __init__(
        self,
        reward_service: XPRewardApplicationService,
        state_repository: GamificationStateRepository,
        transaction_manager: GamificationTransactionManager,
    ) -> None:
        self.reward_service = reward_service
        self.state_repository = state_repository
        self.transaction_manager = transaction_manager

    def process(
        self,
        event: GamificationEvent,
        *,
        activity_date: date | None = None,
    ) -> GamificationProcessResult:
        with self.transaction_manager.transaction():
            state = self.state_repository.get(event.user_id)
            reward = self.reward_service.process(event)

            next_xp = state.xp + reward.xp if reward.awarded else state.xp
            next_streak = StreakState(
                current=state.current_streak,
                longest=state.longest_streak,
                last_activity_date=state.last_activity_date,
            )

            if reward.reason is not RewardReason.ALREADY_PROCESSED:
                next_streak = apply_daily_activity(
                    next_streak,
                    activity_date
                    or event.occurred_at.astimezone(timezone.utc).date(),
                )

            new_achievements = tuple(
                unlocked_achievements(
                    xp=next_xp,
                    streak=next_streak.current,
                    already_unlocked=state.unlocked_achievement_keys,
                )
            )
            all_achievement_keys = tuple(
                dict.fromkeys(
                    (
                        *state.unlocked_achievement_keys,
                        *(item.key for item in new_achievements),
                    )
                )
            )

            self.state_repository.save(
                type(state)(
                    user_id=state.user_id,
                    xp=next_xp,
                    current_streak=next_streak.current,
                    longest_streak=next_streak.longest,
                    last_activity_date=next_streak.last_activity_date,
                    unlocked_achievement_keys=all_achievement_keys,
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
