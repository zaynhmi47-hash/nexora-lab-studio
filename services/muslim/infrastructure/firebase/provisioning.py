from __future__ import annotations

from services.muslim.identity.provisioning import (
    IdentityProvisioningService,
    ProvisionedIdentity,
)


class FirebaseIdentityProvisioner:
    """First-login adapter that provisions a Nexora identity from verified claims."""

    PROVIDER = "firebase"

    def __init__(self, provisioning_service: IdentityProvisioningService) -> None:
        self.provisioning_service = provisioning_service

    def provision_verified_claims(
        self,
        claims: dict[str, object],
    ) -> ProvisionedIdentity:
        firebase_uid = claims.get("uid")
        if not isinstance(firebase_uid, str) or not firebase_uid.strip():
            raise ValueError("verified Firebase claims must contain uid")

        return self.provisioning_service.provision_or_resolve(
            provider=self.PROVIDER,
            provider_subject=firebase_uid,
        )
