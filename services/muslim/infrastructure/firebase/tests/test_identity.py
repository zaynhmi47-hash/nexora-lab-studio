from __future__ import annotations

from dataclasses import dataclass

from services.muslim.identity.provisioning import IdentityProvisioningService
from services.muslim.identity.repository import InMemoryIdentityRepository

from ..identity import FirebaseNexoraIdentityResolver
from ..provisioning import FirebaseIdentityProvisioner
from ...firebase.auth import FirebaseTokenVerifier


@dataclass
class FakeVerifier(FirebaseTokenVerifier):
    claims: dict[str, object]

    def verify_id_token(self, id_token: str) -> dict[str, object]:
        return self.claims


def build_resolver(claims: dict[str, object]) -> FirebaseNexoraIdentityResolver:
    repository = InMemoryIdentityRepository()
    provisioning = IdentityProvisioningService(
        repository=repository,
        transaction_manager=__import__(
            "services.muslim.identity.transaction",
            fromlist=["InMemoryIdentityTransactionManager"],
        ).InMemoryIdentityTransactionManager(),
    )
    return FirebaseNexoraIdentityResolver(
        verifier=FakeVerifier(claims),
        provisioning_service=provisioning,
    )


def test_first_firebase_login_provisions_internal_identity() -> None:
    resolver = build_resolver({"uid": "firebase-user-1", "email": "user@example.com"})

    identity = resolver.resolve_firebase_token("valid-token")

    assert identity.firebase_uid == "firebase-user-1"
    assert identity.user_id
    assert identity.user_id != "firebase-user-1"


def test_repeated_firebase_login_reuses_internal_identity() -> None:
    resolver = build_resolver({"uid": "firebase-user-1"})

    first = resolver.resolve_firebase_token("valid-token")
    second = resolver.resolve_firebase_token("valid-token")

    assert second.user_id == first.user_id


def test_provisioner_requires_uid_in_verified_claims() -> None:
    repository = InMemoryIdentityRepository()
    provisioning = IdentityProvisioningService(
        repository=repository,
        transaction_manager=__import__(
            "services.muslim.identity.transaction",
            fromlist=["InMemoryIdentityTransactionManager"],
        ).InMemoryIdentityTransactionManager(),
    )
    provisioner = FirebaseIdentityProvisioner(provisioning)

    try:
        provisioner.provision_verified_claims({"email": "user@example.com"})
    except ValueError as exc:
        assert "uid" in str(exc)
    else:
        raise AssertionError("missing uid must be rejected")
