from typing import Mapping

from services.muslim.infrastructure.firebase.auth import (
    FirebaseAdminInitializationError,
    FirebaseAdminTokenVerifier,
)


class FakeAuth:
    def __init__(self, claims: Mapping[str, object]):
        self.claims = claims
        self.calls = []

    def verify_id_token(self, token: str, app=None):
        self.calls.append((token, app))
        return self.claims


def test_verifier_accepts_mapping_claims_without_importing_sdk() -> None:
    verifier = FirebaseAdminTokenVerifier()
    fake = FakeAuth({"uid": "firebase-1"})
    verifier._auth_module = fake

    claims = verifier.verify_id_token("token")

    assert claims["uid"] == "firebase-1"
    assert fake.calls == [("token", None)]


def test_verifier_uses_lazy_app_factory() -> None:
    app = object()
    calls = []

    def factory():
        calls.append("created")
        return app

    verifier = FirebaseAdminTokenVerifier(app_factory=factory)
    fake = FakeAuth({"uid": "firebase-1"})
    verifier._auth_module = fake

    first = verifier.verify_id_token("token-1")
    second = verifier.verify_id_token("token-2")

    assert first["uid"] == "firebase-1"
    assert second["uid"] == "firebase-1"
    assert calls == ["created"]
    assert fake.calls == [("token-1", app), ("token-2", app)]


def test_verifier_rejects_non_mapping_claims() -> None:
    verifier = FirebaseAdminTokenVerifier()

    class BadAuth:
        def verify_id_token(self, token: str):
            return ["bad"]

    verifier._auth_module = BadAuth()

    try:
        verifier.verify_id_token("token")
    except FirebaseAdminInitializationError:
        pass
    else:
        raise AssertionError("expected FirebaseAdminInitializationError")


def test_verifier_rejects_both_app_sources() -> None:
    try:
        FirebaseAdminTokenVerifier(app=object(), app_factory=lambda: object())
    except ValueError:
        pass
    else:
        raise AssertionError("app and app_factory must be mutually exclusive")
