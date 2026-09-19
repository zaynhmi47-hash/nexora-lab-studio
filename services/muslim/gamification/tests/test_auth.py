from typing import Mapping

from services.muslim.gamification.auth import (
    AuthenticatedIdentity,
    FirebaseIdentityResolver,
    InvalidCredentials,
)
from services.muslim.gamification.auth_http import AuthenticatedGamificationHTTPAdapter
from services.muslim.gamification.http_adapter import GamificationHTTPResponse


class FakeVerifier:
    def __init__(self, claims: Mapping[str, object] | None = None, error: Exception | None = None):
        self.claims = claims
        self.error = error

    def verify_id_token(self, id_token: str) -> Mapping[str, object]:
        if self.error:
            raise self.error
        return self.claims or {}


class FakeUserResolver:
    def resolve_user_id(self, firebase_uid: str) -> str:
        return f"nexora:{firebase_uid}"


class FakeAdapter:
    def handle(self, request):
        return GamificationHTTPResponse(
            status_code=200,
            body={"success": True, "userId": request.authenticated_user_id},
        )


def test_firebase_identity_resolver_maps_uid_to_internal_user() -> None:
    resolver = FirebaseIdentityResolver(
        FakeVerifier({"uid": "firebase-123", "email": "user@example.com"}),
        FakeUserResolver(),
    )

    identity = resolver.resolve_firebase_token("token")

    assert identity.user_id == "nexora:firebase-123"
    assert identity.firebase_uid == "firebase-123"


def test_firebase_identity_resolver_rejects_invalid_token() -> None:
    resolver = FirebaseIdentityResolver(
        FakeVerifier(error=ValueError("bad token")),
        FakeUserResolver(),
    )

    try:
        resolver.resolve_firebase_token("token")
    except InvalidCredentials:
        pass
    else:
        raise AssertionError("expected InvalidCredentials")


def test_authenticated_http_adapter_requires_bearer_token() -> None:
    adapter = AuthenticatedGamificationHTTPAdapter(
        identity_resolver=FirebaseIdentityResolver(
            FakeVerifier({"uid": "firebase-123"}),
            FakeUserResolver(),
        ),
        gamification_adapter=FakeAdapter(),
    )

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization=None,
    )

    assert response.status_code == 401


def test_authenticated_http_adapter_passes_internal_user_id() -> None:
    adapter = AuthenticatedGamificationHTTPAdapter(
        identity_resolver=FirebaseIdentityResolver(
            FakeVerifier({"uid": "firebase-123"}),
            FakeUserResolver(),
        ),
        gamification_adapter=FakeAdapter(),
    )

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer token",
    )

    assert response.status_code == 200
    assert response.body["userId"] == "nexora:firebase-123"


def test_firebase_identity_resolver_hides_verification_error_details() -> None:
    from services.muslim.infrastructure.firebase.auth import (
        FirebaseAdminTokenVerificationError,
    )

    resolver = FirebaseIdentityResolver(
        FakeVerifier(error=FirebaseAdminTokenVerificationError("token expired")),
        FakeUserResolver(),
    )

    try:
        resolver.resolve_firebase_token("expired-token")
    except InvalidCredentials as exc:
        assert str(exc) == "invalid Firebase ID token"
        assert "token expired" not in str(exc)
    else:
        raise AssertionError("expected InvalidCredentials")


def test_authenticated_http_adapter_returns_401_for_firebase_verification_failure() -> None:
    from services.muslim.infrastructure.firebase.auth import (
        FirebaseAdminTokenVerificationError,
    )

    adapter = AuthenticatedGamificationHTTPAdapter(
        identity_resolver=FirebaseIdentityResolver(
            FakeVerifier(
                error=FirebaseAdminTokenVerificationError("invalid signature"),
            ),
            FakeUserResolver(),
        ),
        gamification_adapter=FakeAdapter(),
    )

    response = adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer invalid-token",
    )

    assert response.status_code == 401
    assert response.body["error"] == "unauthorized"
