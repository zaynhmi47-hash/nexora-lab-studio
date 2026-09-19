from services.muslim.gamification.auth_http import AuthenticatedGamificationHTTPAdapter
from services.muslim.gamification.http_adapter import GamificationHTTPResponse
from services.muslim.identity.repository import InMemoryIdentityRepository
from services.muslim.identity.transaction import InMemoryIdentityTransactionManager
from services.muslim.infrastructure.firebase.auth_composition import (
    FirebaseAuthenticationComposition,
)
from services.muslim.infrastructure.firebase.config import FirebaseAdminConfig


class FakeVerifier:
    def verify_id_token(self, id_token: str):
        return {"uid": "firebase-composition-123"}


class FakeAdapter:
    def handle(self, request):
        return GamificationHTTPResponse(
            status_code=200,
            body={"success": True, "userId": request.authenticated_user_id},
        )


def build_test_composition() -> FirebaseAuthenticationComposition:
    return FirebaseAuthenticationComposition(
        identity_repository=InMemoryIdentityRepository(),
        transaction_manager=InMemoryIdentityTransactionManager(),
        gamification_adapter=FakeAdapter(),
        config=FirebaseAdminConfig(project_id="nexora-73cfa"),
        token_verifier=FakeVerifier(),
    )


def test_composition_builds_complete_authentication_boundary() -> None:
    components = build_test_composition().build()

    assert isinstance(
        components.gamification_adapter,
        AuthenticatedGamificationHTTPAdapter,
    )
    assert components.identity_resolver is not None
    assert components.verifier is not None


def test_composed_resolver_provisions_and_reuses_internal_identity() -> None:
    components = build_test_composition().build()

    first = components.identity_resolver.resolve_firebase_token("token")
    second = components.identity_resolver.resolve_firebase_token("token")

    assert first.user_id
    assert first.user_id != "firebase-composition-123"
    assert second.user_id == first.user_id


def test_composed_http_adapter_only_uses_server_resolved_identity() -> None:
    components = build_test_composition().build()

    response = components.gamification_adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer token",
        body={"userId": "attacker-controlled-id"},
    )

    assert response.status_code == 200
    assert response.body["userId"] != "attacker-controlled-id"
