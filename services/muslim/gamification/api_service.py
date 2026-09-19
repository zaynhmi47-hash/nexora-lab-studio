from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .api_contract import parse_event, serialize_result
from .processor import GamificationEventProcessor


@dataclass(frozen=True, slots=True)
class GamificationAPIResult:
    status_code: int
    body: dict[str, object]


class GamificationAPIService:
    """Framework-neutral application boundary for the gamification endpoint.

    Authentication is deliberately outside this service. The caller must provide
    the authenticated user's ID; the event payload can never choose its own user.
    """

    def __init__(self, processor: GamificationEventProcessor) -> None:
        self.processor = processor

    def handle_event(
        self,
        *,
        authenticated_user_id: str,
        payload: Mapping[str, object],
    ) -> GamificationAPIResult:
        if not authenticated_user_id.strip():
            return GamificationAPIResult(
                status_code=401,
                body={"success": False, "error": "authenticated user is required"},
            )

        try:
            event = parse_event(dict(payload), user_id=authenticated_user_id)
            result = self.processor.process(event)
        except ValueError as exc:
            return GamificationAPIResult(
                status_code=400,
                body={"success": False, "error": str(exc)},
            )

        body = serialize_result(result)
        body["gamification"] = {
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
            "newAchievements": [
                {
                    "key": achievement.key,
                    "name": achievement.name,
                    "description": achievement.description,
                }
                for achievement in result.snapshot.unlocked_achievements
            ],
        }
        return GamificationAPIResult(status_code=200, body=body)
