from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .api_contract import parse_event, serialize_result
from .domain import GamificationEvent, GamificationEventType
from .leveling import level_for_xp
from .processor import GamificationEventProcessor
from .quests import build_quest_progress


@dataclass(frozen=True, slots=True)
class GamificationAPIResult:
    status_code: int
    body: dict[str, object]


class GamificationAPIService:
    """Framework-neutral application boundary for gamification APIs."""

    def __init__(self, processor: GamificationEventProcessor) -> None:
        self.processor = processor

    @staticmethod
    def _snapshot_body(result) -> dict[str, object]:
        return {
            "xp": result.snapshot.xp,
            "level": result.snapshot.level,
            "streak": {
                "current": result.snapshot.streak.current,
                "longest": result.snapshot.streak.longest,
                "lastActivityDate": (
                    result.snapshot.streak.last_activity_date.isoformat()
                    if result.snapshot.streak.last_activity_date
                    else None
                ),
            },
            "quests": [
                {
                    "key": quest.key,
                    "progress": quest.progress,
                    "target": quest.target,
                    "completed": quest.completed,
                    "rewardClaimed": quest.reward_claimed,
                }
                for quest in result.snapshot.quests
            ],
            "newAchievements": [
                {
                    "key": achievement.key,
                    "name": achievement.name,
                    "description": achievement.description,
                }
                for achievement in result.snapshot.unlocked_achievements
            ],
        }

    def handle_profile(self, *, authenticated_user_id: str) -> GamificationAPIResult:
        if not authenticated_user_id.strip():
            return GamificationAPIResult(
                status_code=401,
                body={"success": False, "error": "authenticated user is required"},
            )

        state = self.processor.state_repository.get(authenticated_user_id)
        try:
            today = datetime.now(timezone.utc).astimezone(
                ZoneInfo(state.timezone_name)
            ).date()
        except ZoneInfoNotFoundError:
            return GamificationAPIResult(
                status_code=500,
                body={"success": False, "error": "invalid configured timezone"},
            )

        quest_counts = (
            dict(state.quest_activity_counts)
            if state.quest_date == today
            else {}
        )
        claimed = (
            state.claimed_quest_keys
            if state.quest_date == today
            else ()
        )

        return GamificationAPIResult(
            status_code=200,
            body={
                "success": True,
                "gamification": {
                    "xp": state.xp,
                    "level": level_for_xp(state.xp),
                    "streak": {
                        "current": state.current_streak,
                        "longest": state.longest_streak,
                        "lastActivityDate": (
                            state.last_activity_date.isoformat()
                            if state.last_activity_date
                            else None
                        ),
                    },
                    "quests": [
                        {
                            "key": quest.key,
                            "progress": quest.progress,
                            "target": quest.target,
                            "completed": quest.completed,
                            "rewardClaimed": quest.reward_claimed,
                        }
                        for quest in build_quest_progress(
                            activity_counts=quest_counts,
                            reward_claimed=claimed,
                        )
                    ],
                    "achievements": list(state.unlocked_achievement_keys),
                    "dailyReward": {
                        "claimed": state.daily_reward_date == today,
                        "date": (
                            state.daily_reward_date.isoformat()
                            if state.daily_reward_date
                            else None
                        ),
                    },
                    "streakMilestones": list(state.rewarded_streak_milestones),
                    "timezone": state.timezone_name,
                },
            },
        )

    def handle_event(
        self,
        *,
        authenticated_user_id: str,
        payload: Mapping[str, object],
        activity_date=None,
    ) -> GamificationAPIResult:
        if not authenticated_user_id.strip():
            return GamificationAPIResult(
                status_code=401,
                body={"success": False, "error": "authenticated user is required"},
            )

        try:
            event = parse_event(dict(payload), user_id=authenticated_user_id)
            result = self.processor.process(event, activity_date=activity_date)
        except ValueError as exc:
            return GamificationAPIResult(
                status_code=400,
                body={"success": False, "error": str(exc)},
            )

        body = serialize_result(result)
        body["rewards"] = [
            {
                "awarded": bonus.awarded,
                "xp": bonus.xp,
                "reason": bonus.reason.value if bonus.reason else None,
            }
            for bonus in result.bonus_rewards
        ]
        body["gamification"] = self._snapshot_body(result)
        return GamificationAPIResult(status_code=200, body=body)

    def handle_daily_reward(
        self,
        *,
        authenticated_user_id: str,
    ) -> GamificationAPIResult:
        if not authenticated_user_id.strip():
            return GamificationAPIResult(
                status_code=401,
                body={"success": False, "error": "authenticated user is required"},
            )

        state = self.processor.state_repository.get(authenticated_user_id)
        try:
            claim_date = datetime.now(timezone.utc).astimezone(
                ZoneInfo(state.timezone_name)
            ).date()
        except ZoneInfoNotFoundError:
            return GamificationAPIResult(
                status_code=500,
                body={"success": False, "error": "invalid configured timezone"},
            )

        event = GamificationEvent(
            event_id=f"daily-reward:{authenticated_user_id}:{claim_date.isoformat()}",
            user_id=authenticated_user_id,
            event_type=GamificationEventType.DAILY_REWARD_CLAIMED,
            occurred_at=datetime.now(timezone.utc),
            activity_id=claim_date.isoformat(),
            metadata={"date": claim_date.isoformat()},
        )
        result = self.processor.process(event)
        return GamificationAPIResult(
            status_code=200,
            body={
                **serialize_result(result),
                "gamification": self._snapshot_body(result),
            },
        )

    def handle_set_timezone(
        self,
        *,
        authenticated_user_id: str,
        timezone_name: str,
    ) -> GamificationAPIResult:
        if not authenticated_user_id.strip():
            return GamificationAPIResult(
                status_code=401,
                body={"success": False, "error": "authenticated user is required"},
            )
        if not isinstance(timezone_name, str) or not timezone_name.strip():
            return GamificationAPIResult(
                status_code=400,
                body={"success": False, "error": "timezone is required"},
            )
        try:
            ZoneInfo(timezone_name)
        except (ZoneInfoNotFoundError, ValueError):
            return GamificationAPIResult(
                status_code=400,
                body={"success": False, "error": "invalid IANA timezone"},
            )

        state = self.processor.state_repository.get(authenticated_user_id)
        self.processor.state_repository.save(
            type(state)(
                user_id=state.user_id,
                xp=state.xp,
                current_streak=state.current_streak,
                longest_streak=state.longest_streak,
                last_activity_date=state.last_activity_date,
                unlocked_achievement_keys=state.unlocked_achievement_keys,
                quest_date=state.quest_date,
                quest_activity_counts=state.quest_activity_counts,
                claimed_quest_keys=state.claimed_quest_keys,
                daily_reward_date=state.daily_reward_date,
                rewarded_streak_milestones=state.rewarded_streak_milestones,
                timezone_name=timezone_name,
            )
        )
        return GamificationAPIResult(
            status_code=200,
            body={"success": True, "timezone": timezone_name},
        )
