from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .auth import AuthenticationError, UserIdentityResolver
from .http_adapter import GamificationHTTPRequest, GamificationHTTPResponse
from .api_service import GamificationAPIResult


@dataclass(frozen=True, slots=True)
class AuthenticatedGamificationHTTPAdapter:
    """Authentication-aware adapter around the framework-neutral route adapter."""

    identity_resolver: UserIdentityResolver
    gamification_adapter: object

    def handle(
        self,
        *,
        method: str,
        path: str,
        authorization: str | None,
        body: Mapping[str, object] | None = None,
    ) -> GamificationHTTPResponse:
        if not authorization or not authorization.startswith("Bearer "):
            return GamificationHTTPResponse(
                status_code=401,
                body={"success": False, "error": "Bearer token is required"},
            )

        token = authorization[7:].strip()
        try:
            identity = self.identity_resolver.resolve_firebase_token(token)
        except AuthenticationError as exc:
            return GamificationHTTPResponse(
                status_code=401,
                body={"success": False, "error": str(exc)},
            )

        request = GamificationHTTPRequest(
            method=method,
            path=path,
            authenticated_user_id=identity.user_id,
            body=body,
        )
        return self.gamification_adapter.handle(request)
