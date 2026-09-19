from __future__ import annotations

from services.muslim.gamification.auth import FirebaseIdentityResolver
from services.muslim.identity.repository import IdentityRepository


class FirebaseNexoraIdentityResolver(FirebaseIdentityResolver):
    """Resolve verified Firebase users through Nexora's identity repository."""

    PROVIDER = "firebase"

    def __init__(self, verifier, repository: IdentityRepository) -> None:
        super().__init__(
            verifier=verifier,
            user_id_resolver=repository,
        )
        self.repository = repository

    def resolve_user_id(self, firebase_uid: str) -> str:
        user_id = self.repository.get_user_id_by_provider_subject(
            provider=self.PROVIDER,
            provider_subject=firebase_uid,
        )
        if user_id is None:
            raise LookupError(
                "Firebase account is not linked to a Nexora identity"
            )
        return user_id
