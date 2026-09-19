from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from zoneinfo import ZoneInfo

from .achievements import AchievementDefinition, unlocked_achievements
from .application import XPRewardApplicationService
from .domain import (
    GamificationEvent,
    GamificationEventType,
    RewardReason,
    RewardResult,
)
from .leveling import level_for_xp
from .quests import QuestProgress, advance_daily_quests, build_quest_progress
from .state_repository import GamificationStateRepository
from .streaks import StreakState, apply_daily_activity
from .transaction import GamificationTransactionManager


@dataclass(frozen=True, slots=True)
class GamificationSnapshot:
    xp: int
    level: int
    streak: StreakState
    unlocked_achievements: tuple[AchievementDefinition, ...]
    quests: tuple[QuestProgress, ...] = ()


@dataclass(frozen=True, slots=True)
class GamificationProcessResult:
    reward: RewardResult
    snapshot: GamificationSnapshot
    bonus_rewards: tuple[RewardResult, ...] = ()


STREAK_MILESTONES: tuple[int, ...] = (7, 30)

STREAK_ELIGIBLE_EVENT_TYPES: frozenset[GamificationEventType] = frozenset({
    GamificationEventType.LESSON_COMPLETED,
    GamificationEventType.QUIZ_COMPLETED,
    GamificationEventType.TAJWID_PRACTICE_COMPLETED,
    GamificationEventType.TAJWID_ASSESSMENT_COMPLETED,
    GamificationEventType.ARABIC_LESSON_COMPLETED,
    GamificationEventType.DAILY_ACTIVITY_COMPLETED,
})

QUEST_REWARD_EVENT_TYPES: dict[str, GamificationEventType] = {
    "daily_learn": GamificationEventType.DAILY_LEARN_QUEST_COMPLETED,
    "daily_quiz": GamificationEventType.DAILY_QUIZ_QUEST_COMPLETED,
    "daily_tajwid": GamificationEventType.DAILY_TAJWID_QUEST_COMPLETED,
}


class GamificationEventProcessor:
    """Coordinates server-owned XP, streaks, quests and achievements atomically."""

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
            current_date = activity_date or event.occurred_at.astimezone(ZoneInfo(state.timezone_name)).date()

            next_xp = state.xp + reward.xp if reward.awarded else state.xp
            next_streak = StreakState(
                current=state.current_streak,
                longest=state.longest_streak,
                last_activity_date=state.last_activity_date,
            )

            if (
                reward.reason is not RewardReason.ALREADY_PROCESSED
                and event.event_type in STREAK_ELIGIBLE_EVENT_TYPES
            ):
                next_streak = apply_daily_activity(next_streak, current_date)

            quest_counts = dict(state.quest_activity_counts)
            claimed_quests = set(state.claimed_quest_keys)
            if state.quest_date != current_date:
                quest_counts = {}
                claimed_quests = set()

            bonus_rewards: list[RewardResult] = []

            next_quest_counts, newly_completed = advance_daily_quests(
                activity_counts=quest_counts,
                event_type=event.event_type.value,
            )

            for quest_key in newly_completed:
                if quest_key in claimed_quests:
                    continue

                quest_event_type = QUEST_REWARD_EVENT_TYPES[quest_key]
                quest_event = GamificationEvent(
                    event_id=f"quest:{current_date.isoformat()}:{quest_key}",
                    user_id=event.user_id,
                    event_type=quest_event_type,
                    occurred_at=event.occurred_at,
                    activity_id=f"{current_date.isoformat()}:{quest_key}",
                    metadata={"questKey": quest_key, "date": current_date.isoformat()},
                )
                quest_reward = self.reward_service.process(quest_event)
                bonus_rewards.append(quest_reward)

                if quest_reward.awarded:
                    next_xp += quest_reward.xp
                    claimed_quests.add(quest_key)

            rewarded_milestones = set(state.rewarded_streak_milestones)
            for milestone in STREAK_MILESTONES:
                if (
                    next_streak.current >= milestone
                    and milestone not in rewarded_milestones
                ):
                    milestone_event = GamificationEvent(
                        event_id=f"streak-milestone:{event.user_id}:{milestone}",
                        user_id=event.user_id,
                        event_type=GamificationEventType.STREAK_MILESTONE,
                        occurred_at=event.occurred_at,
                        activity_id=f"streak:{milestone}",
                        metadata={"milestone": milestone},
                    )
                    milestone_reward = self.reward_service.process(milestone_event)
                    bonus_rewards.append(milestone_reward)
                    if milestone_reward.awarded:
                        next_xp += milestone_reward.xp
                        rewarded_milestones.add(milestone)

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
                    quest_date=current_date,
                    quest_activity_counts=tuple(sorted(next_quest_counts.items())),
                    claimed_quest_keys=tuple(sorted(claimed_quests)),
                    daily_reward_date=(
                        current_date
                        if (
                            event.event_type
                            is GamificationEventType.DAILY_REWARD_CLAIMED
                            and reward.awarded
                        )
                        else state.daily_reward_date
                    ),
                    rewarded_streak_milestones=tuple(sorted(rewarded_milestones)),
                    timezone_name=state.timezone_name,
                )
            )

            return GamificationProcessResult(
                reward=reward,
                snapshot=GamificationSnapshot(
                    xp=next_xp,
                    level=level_for_xp(next_xp),
                    streak=next_streak,
                    unlocked_achievements=new_achievements,
                    quests=tuple(
                        build_quest_progress(
                            activity_counts=next_quest_counts,
                            reward_claimed=claimed_quests,
                        )
                    ),
                ),
                bonus_rewards=tuple(bonus_rewards),
            )
