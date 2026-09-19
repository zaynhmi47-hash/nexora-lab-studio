from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Any


@dataclass(frozen=True, slots=True)
class FirebaseAdminConfig:
    """Non-secret Firebase Admin runtime configuration.

    The Admin SDK resolves credentials through Application Default Credentials.
    This config intentionally stores no private key, service-account JSON, or
    other credential material.
    """

    project_id: str | None = None

    @classmethod
    def from_env(cls) -> "FirebaseAdminConfig":
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if project_id is not None:
            project_id = project_id.strip() or None
        return cls(project_id=project_id)


class FirebaseAdminAppFactory:
    """Create/reuse the Firebase Admin app using runtime credentials."""

    def __init__(self, config: FirebaseAdminConfig | None = None) -> None:
        self.config = config or FirebaseAdminConfig.from_env()

    def create(self) -> Any:
        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError as exc:
            raise RuntimeError(
                "firebase-admin is required for Firebase Admin initialization"
            ) from exc

        try:
            return firebase_admin.get_app()
        except ValueError:
            options: dict[str, str] = {}
            if self.config.project_id:
                options["projectId"] = self.config.project_id

            credential = credentials.ApplicationDefault()
            return firebase_admin.initialize_app(credential, options=options)
