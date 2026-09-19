from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Protocol


class AuthenticationError(Exception):
    """Base authentication failure."""


class InvalidCredentials(AuthenticationError):
    pass


class UserIdentityResolver(Protocol):
    def resolve_firebase_token(self, id_token: str) -> "AuthenticatedIdentity":
        ...


@dataclass(frozen=True, slots=True)
class AuthenticatedIdentity:
    """Trusted identity produced after server-side token verification."""

    user_id: str
    firebase_uid: str
    claims: Mapping[str, object]


class FirebaseTokenVerifier(Protocol):
    def verify_id_token(self, id_token: str) -> Mapping[str, object]:
        ...


class FirebaseIdentityResolver:
    """Maps a verified Firebase UID to the internal Nexora user UUID.

    The actual Firebase Admin SDK is deliberately injected through a verifier
    port. This keeps the gamification domain independent from an HTTP framework
    and from Firebase SDK initialization.
    """

    def __init__(
        self,
        verifier: FirebaseTokenVerifier,
        user_id_resolver,
    ) -> None:
        self.verifier = verifier
        self.user_id_resolver = user_id_resolver

    def resolve_firebase_token(self, id_token: str) -> AuthenticatedIdentity:
        if not isinstance(id_token, str) or not id_token.strip():
            raise InvalidCredentials("Bearer token is required")

        try:
            claims = dict(self.verifier.verify_id_token(id_token))
        except Exception as exc:
            raise InvalidCredentials("invalid Firebase ID token") from exc

        firebase_uid = claims.get("uid")
        if not isinstance(firebase_uid, str) or not firebase_uid.strip():
            raise InvalidCredentials("Firebase token has no valid uid")

        try:
            user_id = self.user_id_resolver.resolve_user_id(firebase_uid)
        except Exception as exc:
            raise InvalidCredentials("unable to resolve internal user") from exc

        if not isinstance(user_id, str) or not user_id.strip():
            raise InvalidCredentials("internal user ID is invalid")

        return AuthenticatedIdentity(
            user_id=user_id,
            firebase_uid=firebase_uid,
            claims=claims,
        )
