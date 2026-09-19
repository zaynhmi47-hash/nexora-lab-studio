from __future__ import annotations

from typing import Mapping

from services.muslim.gamification.auth import (
    AuthenticatedIdentity,
    FirebaseIdentityResolver,
    FirebaseTokenVerifier,
)
from services.muslim.identity.provisioning import IdentityProvisioningService

from .provisioning import FirebaseIdentityProvisioner


class FirebaseNexoraIdentityResolver(FirebaseIdentityResolver):
    """Resolve Firebase identities against Nexora's internal identity registry.

    Existing provider links are resolved idempotently. When a verified Firebase
    account is seen for the first time, the provisioning service creates the
    internal Nexora UUID and provider link before the identity is returned.
    """

    PROVIDER = "firebase"

    def __init__(
        self,
        verifier: FirebaseTokenVerifier,
        provisioning_service: IdentityProvisioningService,
    ) -> None:
        self.provisioner = FirebaseIdentityProvisioner(provisioning_service)
        super().__init__(
            verifier=verifier,
            user_id_resolver=self,
        )

    def resolve_user_id(self, firebase_uid: str) -> str:
        result = self.provisioner.provision_verified_claims({"uid": firebase_uid})
        return result.identity.user_id

    def resolve_firebase_token(
        self,
        id_token: str,
    ) -> AuthenticatedIdentity:
        return super().resolve_firebase_token(id_token)


def firebase_identity_claims(
    identity: AuthenticatedIdentity,
) -> Mapping[str, object]:
    """Expose verified claims without coupling callers to the resolver internals."""
    return identity.claims
