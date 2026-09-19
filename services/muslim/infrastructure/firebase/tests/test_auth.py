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
