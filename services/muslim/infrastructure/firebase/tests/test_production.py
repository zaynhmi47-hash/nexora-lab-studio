from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from services.muslim.infrastructure.firebase.production import (
    ProductionFirebaseAuthenticationFactory,
)


class FakeCursor:
    def __init__(self, row=None) -> None:
        self.row = row

    def fetchone(self):
        return self.row


class FakeConnection:
    def __init__(self) -> None:
        self.identity = None
        self.provider = None
        self.commits = 0
        self.rollbacks = 0

    def execute(self, query, params=()):
        normalized = " ".join(query.split()).upper()
        if normalized.startswith("SELECT USER_ID FROM NEXORA_PROVIDER_ACCOUNTS"):
            if self.provider is None:
                return FakeCursor()
            return FakeCursor((self.provider[0],))

        if normalized.startswith("SELECT ID, USER_ID, CREATED_AT, UPDATED_AT FROM NEXORA_PROVIDER_ACCOUNTS"):
            if self.provider is None:
                return FakeCursor()
            return FakeCursor(self.provider)

        if normalized.startswith("SELECT USER_ID, CREATED_AT, UPDATED_AT FROM NEXORA_IDENTITIES"):
            if self.identity is None:
                return FakeCursor()
            return FakeCursor(self.identity)

        if normalized.startswith("INSERT INTO NEXORA_IDENTITIES"):
            user_id, created_at, updated_at = params
            self.identity = (user_id, created_at, updated_at)
            return FakeCursor()

        if normalized.startswith("INSERT INTO NEXORA_PROVIDER_ACCOUNTS"):
            account_id, provider, subject, user_id, created_at, updated_at = params
            self.provider = (account_id, user_id, created_at, updated_at)
            return FakeCursor()

        if normalized.startswith("UPDATE NEXORA_PROVIDER_ACCOUNTS"):
            updated_at, _account_id = params
            self.provider = (
                self.provider[0],
                self.provider[1],
                self.provider[2],
                updated_at,
            )
            return FakeCursor()

        raise AssertionError(f"unexpected SQL: {query}")

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


class FakeVerifier:
    def verify_id_token(self, token: str):
        assert token == "firebase-token"
        return {"uid": "firebase-user-123"}


class FakeGamificationAdapter:
    def handle(self, request):
        return {"user_id": request.authenticated_user_id}


def test_production_factory_uses_database_backed_identity_path():
    connection = FakeConnection()
    components = ProductionFirebaseAuthenticationFactory(
        connection=connection,
        gamification_adapter=FakeGamificationAdapter(),
        token_verifier=FakeVerifier(),
    ).build()

    identity = components.identity_resolver.resolve_firebase_token("firebase-token")

    UUID(identity.user_id)
    assert connection.commits == 1
    assert connection.rollbacks == 0

    reused = components.identity_resolver.resolve_firebase_token("firebase-token")
    assert reused.user_id == identity.user_id
    assert connection.commits == 2


def test_production_factory_builds_authenticated_gamification_adapter():
    connection = FakeConnection()
    components = ProductionFirebaseAuthenticationFactory(
        connection=connection,
        gamification_adapter=FakeGamificationAdapter(),
        token_verifier=FakeVerifier(),
    ).build()

    response = components.gamification_adapter.handle(
        method="GET",
        path="/gamification/profile/",
        authorization="Bearer firebase-token",
        body={"userId": "attacker-controlled"},
    )

    assert response == {"user_id": response["user_id"]}
    assert response["user_id"] != "attacker-controlled"
    assert connection.commits == 1
