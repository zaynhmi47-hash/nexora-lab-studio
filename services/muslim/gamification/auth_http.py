from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .api_service import GamificationAPIResult
from .auth import AuthenticationError, UserIdentityResolver
from .http_adapter import GamificationHTTPRequest, GamificationHTTPResponse


@dataclass(frozen=True, slots=True)
class AuthenticatedGamificationHTTPAdapter:
    """Authentication-aware adapter around the framework-neutral route adapter.

    This is the HTTP trust boundary: the bearer token is the only credential
    accepted from the request, while the internal Nexora user ID is resolved
    server-side and injected into the downstream request contract.
    """

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
        token = self._extract_bearer_token(authorization)
        if token is None:
            return GamificationHTTPResponse(
                status_code=401,
                body={"success": False, "error": "Bearer token is required"},
            )

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

    @staticmethod
    def _extract_bearer_token(authorization: str | None) -> str | None:
        if not isinstance(authorization, str):
            return None

        scheme, separator, credentials = authorization.strip().partition(" ")
        if not separator or scheme.lower() != "bearer":
            return None

        token = credentials.strip()
        return token or None
