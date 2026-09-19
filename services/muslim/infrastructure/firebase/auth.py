from __future__ import annotations

from typing import Any, Callable, Mapping

from services.muslim.gamification.auth import FirebaseTokenVerifier


class FirebaseAdminInitializationError(RuntimeError):
    """Firebase Admin SDK could not be initialized."""


class FirebaseAdminTokenVerifier(FirebaseTokenVerifier):
    """Lazy Firebase Admin SDK verifier.

    The SDK and Admin app are initialized only when verification is requested.
    Credentials are resolved by the Firebase Admin SDK from the host runtime
    (typically Application Default Credentials).
    """

    def __init__(
        self,
        app: Any | None = None,
        app_factory: Callable[[], Any] | None = None,
    ) -> None:
        if app is not None and app_factory is not None:
            raise ValueError("provide either app or app_factory, not both")
        self._app = app
        self._app_factory = app_factory
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

    def _get_app(self) -> Any | None:
        if self._app is not None:
            return self._app
        if self._app_factory is None:
            return None

        try:
            self._app = self._app_factory()
        except Exception as exc:
            raise FirebaseAdminInitializationError(
                "Firebase Admin app initialization failed"
            ) from exc
        return self._app

    def verify_id_token(self, id_token: str) -> Mapping[str, object]:
        if not isinstance(id_token, str) or not id_token.strip():
            raise ValueError("id_token is required")

        auth = self._get_auth_module()
        app = self._get_app()
        try:
            if app is None:
                decoded = auth.verify_id_token(id_token)
            else:
                decoded = auth.verify_id_token(id_token, app=app)
        except Exception as exc:
            raise FirebaseAdminInitializationError(
                "Firebase ID token verification failed"
            ) from exc

        if not isinstance(decoded, Mapping):
            raise FirebaseAdminInitializationError(
                "Firebase Admin returned invalid token claims"
            )

        return dict(decoded)
