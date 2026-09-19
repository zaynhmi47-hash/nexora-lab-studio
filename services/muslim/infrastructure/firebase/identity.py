from __future__ import annotations

from services.muslim.gamification.auth import (
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
