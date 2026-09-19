from __future__ import annotations

from services.muslim.identity.provisioning import IdentityProvisioningService
from services.muslim.identity.repository import InMemoryIdentityRepository
from services.muslim.identity.transaction import InMemoryIdentityTransactionManager

from ..identity import FirebaseNexoraIdentityResolver
from ..provisioning import FirebaseIdentityProvisioner


class FakeVerifier:
    def __init__(self, claims: dict[str, object]) -> None:
        self.claims = claims

    def verify_id_token(self, id_token: str) -> dict[str, object]:
        return self.claims


def build_provisioning() -> IdentityProvisioningService:
    return IdentityProvisioningService(
        repository=InMemoryIdentityRepository(),
        transaction_manager=InMemoryIdentityTransactionManager(),
    )


def test_first_firebase_login_provisions_internal_identity() -> None:
    resolver = FirebaseNexoraIdentityResolver(
        verifier=FakeVerifier({"uid": "firebase-user-1", "email": "user@example.com"}),
        provisioning_service=build_provisioning(),
    )

    identity = resolver.resolve_firebase_token("valid-token")

    assert identity.firebase_uid == "firebase-user-1"
    assert identity.user_id
    assert identity.user_id != "firebase-user-1"


def test_repeated_firebase_login_reuses_internal_identity() -> None:
    resolver = FirebaseNexoraIdentityResolver(
        verifier=FakeVerifier({"uid": "firebase-user-1"}),
        provisioning_service=build_provisioning(),
    )

    first = resolver.resolve_firebase_token("valid-token")
    second = resolver.resolve_firebase_token("valid-token")

    assert second.user_id == first.user_id


def test_provisioner_requires_uid_in_verified_claims() -> None:
    provisioner = FirebaseIdentityProvisioner(build_provisioning())

    try:
        provisioner.provision_verified_claims({"email": "user@example.com"})
    except ValueError as exc:
        assert "uid" in str(exc)
    else:
        raise AssertionError("missing uid must be rejected")
