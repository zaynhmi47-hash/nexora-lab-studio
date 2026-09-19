from __future__ import annotations

from typing import Any, Mapping

from services.muslim.gamification.auth import FirebaseTokenVerifier


class FirebaseAdminInitializationError(RuntimeError):
    """Firebase Admin SDK could not be initialized."""


class FirebaseAdminTokenVerifier(FirebaseTokenVerifier):
    """Lazy Firebase Admin SDK verifier.

    The SDK is imported and initialized only when verification is requested.
    This avoids startup-time network calls and keeps Firebase optional at import
    time. Credentials are supplied by the host application's Admin SDK setup.
    """

    def __init__(self, app: Any | None = None) -> None:
        self._app = app
        self._auth_module: Any | None = None

    def _get_auth_module(self) -> Any:
        if self._auth_module is not None:
            return self._auth_module

        try:
            from firebase_admin import auth
        except ImportError as exc:
            raise FirebaseAdminInitializationError(
                "firebase-admin is required for Firebase authentication"
            ) from exc

        self._auth_module = auth
        return auth

    def verify_id_token(self, id_token: str) -> Mapping[str, object]:
        if not isinstance(id_token, str) or not id_token.strip():
            raise ValueError("id_token is required")

        auth = self._get_auth_module()
        try:
            if self._app is None:
                decoded = auth.verify_id_token(id_token)
            else:
                decoded = auth.verify_id_token(id_token, app=self._app)
        except Exception as exc:
            raise FirebaseAdminInitializationError(
                "Firebase ID token verification failed"
            ) from exc

        if not isinstance(decoded, Mapping):
            raise FirebaseAdminInitializationError(
                "Firebase Admin returned invalid token claims"
            )

        return dict(decoded)
