from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from services.muslim.gamification.auth import (
    AuthenticatedIdentity,
    AuthenticationError,
    UserIdentityResolver,
)
from services.muslim.gamification.auth_http import AuthenticatedGamificationHTTPAdapter
from services.muslim.gamification.http_adapter import (
    GamificationHTTPRequest,
    GamificationHTTPResponse,
)


@dataclass
class FakeIdentityResolver(UserIdentityResolver):
    identity: AuthenticatedIdentity | None = None
    error: AuthenticationError | None = None
    tokens: list[str] | None = None

    def __post_init__(self) -> None:
        if self.tokens is None:
            self.tokens = []

    def resolve_firebase_token(self, id_token: str) -> AuthenticatedIdentity:
        assert self.tokens is not None
        self.tokens.append(id_token)
        if self.error:
            raise self.error
        assert self.identity is not None
        return self.identity


class RecordingGamificationAdapter:
    def __init__(self) -> None:
        self.requests: list[GamificationHTTPRequest] = []

    def handle(self, request: GamificationHTTPRequest) -> GamificationHTTPResponse:
        self.requests.append(request)
        return GamificationHTTPResponse(
            status_code=200,
            body={"success": True, "userId": request.authenticated_user_id},
        )


def build_auth_adapter(
    *,
    identity_resolver: FakeIdentityResolver | None = None,
) -> tuple[AuthenticatedGamificationHTTPAdapter, FakeIdentityResolver, RecordingGamificationAdapter]:
    resolver = identity_resolver or FakeIdentityResolver(
        identity=AuthenticatedIdentity(
            user_id="internal-user-1",
            firebase_uid="firebase-user-1",
            claims={"uid": "firebase-user-1"},
        )
    )
    adapter = RecordingGamificationAdapter()
    return (
        AuthenticatedGamificationHTTPAdapter(
            identity_resolver=resolver,
            gamification_adapter=adapter,
        ),
        resolver,
        adapter,
    )


def test_auth_http_requires_bearer_token() -> None:
    adapter, resolver, route_adapter = build_auth_adapter()

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization=None,
    )

    assert response.status_code == 401
    assert response.body["success"] is False
    assert resolver.tokens == []
    assert route_adapter.requests == []


def test_auth_http_rejects_empty_bearer_token() -> None:
    adapter, resolver, route_adapter = build_auth_adapter()

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer   ",
    )

    assert response.status_code == 401
    assert resolver.tokens == []
    assert route_adapter.requests == []


def test_auth_http_rejects_invalid_token() -> None:
    resolver = FakeIdentityResolver(error=AuthenticationError("invalid Firebase ID token"))
    adapter, resolver, route_adapter = build_auth_adapter(identity_resolver=resolver)

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer attacker-token",
    )

    assert response.status_code == 401
    assert response.body["error"] == "invalid Firebase ID token"
    assert resolver.tokens == ["attacker-token"]
    assert route_adapter.requests == []


def test_auth_http_resolves_identity_server_side() -> None:
    adapter, resolver, route_adapter = build_auth_adapter()

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer verified-token",
        body={"userId": "attacker-selected-user"},
    )

    assert response.status_code == 200
    assert resolver.tokens == ["verified-token"]
    assert len(route_adapter.requests) == 1
    request = route_adapter.requests[0]
    assert request.authenticated_user_id == "internal-user-1"
    assert request.body == {"userId": "attacker-selected-user"}
    assert response.body["userId"] == "internal-user-1"


def test_auth_http_does_not_forward_client_user_id_as_authenticated_identity() -> None:
    adapter, _, route_adapter = build_auth_adapter()

    response = adapter.handle(
        method="POST",
        path="/gamification/events/",
        authorization="Bearer verified-token",
        body={
            "userId": "another-internal-user",
            "eventId": "event-1",
        },
    )

    assert response.status_code == 200
    assert route_adapter.requests[0].authenticated_user_id == "internal-user-1"
    assert route_adapter.requests[0].body is not None
    assert route_adapter.requests[0].body["userId"] == "another-internal-user"


def test_auth_http_passes_identity_and_request_context_to_route_adapter() -> None:
    adapter, _, route_adapter = build_auth_adapter()

    response = adapter.handle(
        method="POST",
        path="/gamification/timezone/",
        authorization="Bearer verified-token",
        body={"timezone": "Asia/Jakarta"},
    )

    assert response.status_code == 200
    request = route_adapter.requests[0]
    assert request.method == "POST"
    assert request.path == "/gamification/timezone/"
    assert request.authenticated_user_id == "internal-user-1"
    assert request.body == {"timezone": "Asia/Jakarta"}
