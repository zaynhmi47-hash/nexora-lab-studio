from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Mapping

from .api_service import GamificationAPIResult, GamificationAPIService


@dataclass(frozen=True, slots=True)
class GamificationHTTPRequest:
    """Minimal HTTP request contract for framework adapters."""

    method: str
    path: str
    authenticated_user_id: str | None
    body: Mapping[str, object] | None = None


@dataclass(frozen=True, slots=True)
class GamificationHTTPResponse:
    status_code: int
    body: dict[str, object]
    content_type: str = "application/json"

    def json_bytes(self) -> bytes:
        return json.dumps(
            self.body,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")


class GamificationHTTPAdapter:
    """Maps HTTP routes to the framework-neutral gamification application service.

    Authentication is intentionally resolved by the host application. The adapter
    only receives the authenticated internal user ID and never trusts a user ID
    from the request body.
    """

    EVENT_PATH = "/gamification/events/"
    PROFILE_PATH = "/gamification/profile/"
    DAILY_REWARD_PATH = "/gamification/daily-reward/claim/"
    TIMEZONE_PATH = "/gamification/timezone/"

    def __init__(self, service: GamificationAPIService) -> None:
        self.service = service

    def handle(self, request: GamificationHTTPRequest) -> GamificationHTTPResponse:
        method = request.method.upper()
        user_id = request.authenticated_user_id

        if not user_id or not user_id.strip():
            return self._response(
                GamificationAPIResult(
                    status_code=401,
                    body={"success": False, "error": "authenticated user is required"},
                )
            )

        if request.path == self.PROFILE_PATH and method == "GET":
            return self._response(
                self.service.handle_profile(authenticated_user_id=user_id)
            )

        if request.path == self.EVENT_PATH and method == "POST":
            return self._response(
                self.service.handle_event(
                    authenticated_user_id=user_id,
                    payload=request.body or {},
                )
            )

        if request.path == self.DAILY_REWARD_PATH and method == "POST":
            return self._response(
                self.service.handle_daily_reward(authenticated_user_id=user_id)
            )

        if request.path == self.TIMEZONE_PATH and method == "POST":
            body = request.body or {}
            timezone_name = body.get("timezone")
            if not isinstance(timezone_name, str):
                return self._response(
                    GamificationAPIResult(
                        status_code=400,
                        body={"success": False, "error": "timezone is required"},
                    )
                )
            return self._response(
                self.service.handle_set_timezone(
                    authenticated_user_id=user_id,
                    timezone_name=timezone_name,
                )
            )

        return GamificationHTTPResponse(
            status_code=404,
            body={"success": False, "error": "route not found"},
        )

    @staticmethod
    def _response(result: GamificationAPIResult) -> GamificationHTTPResponse:
        return GamificationHTTPResponse(
            status_code=result.status_code,
            body=result.body,
        )
