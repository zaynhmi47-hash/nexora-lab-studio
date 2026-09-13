from __future__ import annotations

from infrastructure.firebase.configuration import FirebaseConfiguration
from infrastructure.firebase.initialization import FirebaseInitializer
from infrastructure.firebase.providers.identity import FirebaseIdentityProvider
from infrastructure.firebase.providers.messaging import FirebaseMessagingProvider
from infrastructure.firebase.providers.realtime import FirebaseRealtimeDataProvider
from infrastructure.firebase.providers.storage import FirebaseObjectStorageProvider


class FirebaseProviderRegistry:
    """Centralized construction point for Firebase-backed infrastructure ports."""

    def __init__(self, configuration: FirebaseConfiguration | None = None, initializer: FirebaseInitializer | None = None):
        self.configuration = configuration
        self.initializer = initializer or FirebaseInitializer()

    def _app(self):
        return self.initializer.initialize(self.configuration)

    def identity(self):
        return FirebaseIdentityProvider(app=self._app())

    def storage(self):
        return FirebaseObjectStorageProvider(app=self._app())

    def messaging(self):
        return FirebaseMessagingProvider(app=self._app())

    def realtime(self):
        return FirebaseRealtimeDataProvider(app=self._app())
