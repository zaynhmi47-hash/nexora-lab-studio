from __future__ import annotations

from typing import Any

from infrastructure.common.exceptions import ProviderAuthenticationError, ProviderUnavailableError
from infrastructure.identity.ports.identity_provider import IdentityClaims, IdentityProvider


class FirebaseIdentityProvider:
    provider_name = "firebase"

    def __init__(self, *, app: Any = None, auth_client: Any = None):
        self.app = app
        if auth_client is None:
            try:
                from firebase_admin import auth
            except ImportError as exc:
                raise ProviderUnavailableError("Firebase Authentication is unavailable.", provider=self.provider_name) from exc
            auth_client = auth
        self.auth_client = auth_client

    def verify_token(self, token: str) -> IdentityClaims:
        if not token or not isinstance(token, str):
            raise ProviderAuthenticationError("Firebase identity token is invalid.", provider=self.provider_name)
        try:
            decoded = self.auth_client.verify_id_token(token, app=self.app)
            return IdentityClaims(provider=self.provider_name, provider_subject=str(decoded["uid"]), email=decoded.get("email"), email_verified=bool(decoded.get("email_verified", False)), display_name=decoded.get("name"), claims={key: value for key, value in decoded.items() if key not in {"uid", "email", "email_verified", "name"}})
        except Exception as exc:
            raise ProviderAuthenticationError("Firebase identity token verification failed.", provider=self.provider_name) from exc

    def revoke_session(self, provider_subject: str) -> None:
        try:
            self.auth_client.revoke_refresh_tokens(provider_subject, app=self.app)
        except Exception as exc:
            raise ProviderUnavailableError("Firebase session revocation failed.", provider=self.provider_name) from exc


def ensure_identity_provider(provider: FirebaseIdentityProvider) -> IdentityProvider:
    return provider
