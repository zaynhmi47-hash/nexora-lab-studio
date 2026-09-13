from __future__ import annotations

from typing import Any

from infrastructure.common.exceptions import InfrastructureError, ProviderConfigurationError
from infrastructure.firebase.configuration import FirebaseConfiguration


class FirebaseInitializer:
    """Lazily initialize Firebase Admin once, without network work at import time."""

    def initialize(self, configuration: FirebaseConfiguration | None = None) -> Any:
        configuration = configuration or FirebaseConfiguration.from_environment()
        configuration.validate()
        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError as exc:
            raise ProviderConfigurationError("firebase-admin is not installed.", provider="firebase") from exc
        try:
            return firebase_admin.get_app(configuration.app_name)
        except ValueError:
            pass
        try:
            credential = credentials.Certificate(str(configuration.credentials_file)) if configuration.credentials_file else credentials.ApplicationDefault()
            options = {"projectId": configuration.project_id}
            if configuration.storage_bucket:
                options["storageBucket"] = configuration.storage_bucket
            if configuration.database_url:
                options["databaseURL"] = configuration.database_url
            return firebase_admin.initialize_app(credential, options=options, name=configuration.app_name)
        except (OSError, ValueError, RuntimeError) as exc:
            raise InfrastructureError("Firebase Admin initialization failed.", provider="firebase") from exc
