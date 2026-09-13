from __future__ import annotations

from typing import Any

from infrastructure.common.exceptions import ProviderUnavailableError, RealtimeProviderError
from infrastructure.common.types import JSONValue
from infrastructure.realtime.ports.realtime_provider import RealtimeDataProvider


class FirebaseRealtimeDataProvider:
    provider_name = "firebase"

    def __init__(self, *, app: Any = None, database_client: Any = None):
        self.app = app
        if database_client is None:
            try:
                from firebase_admin import db
            except ImportError as exc:
                raise ProviderUnavailableError("Firebase Realtime Database is unavailable.", provider=self.provider_name) from exc
            database_client = db
        self.database_client = database_client

    def _reference(self, path: str):
        if not path or not path.startswith("/"):
            raise RealtimeProviderError("Realtime database paths must start with '/'.", provider=self.provider_name)
        return self.database_client.reference(path, app=self.app)

    def get(self, path: str) -> JSONValue:
        try:
            return self._reference(path).get()
        except RealtimeProviderError:
            raise
        except Exception as exc:
            raise RealtimeProviderError("Firebase Realtime Database read failed.", provider=self.provider_name) from exc

    def set(self, path: str, value: JSONValue) -> None:
        try:
            self._reference(path).set(value)
        except RealtimeProviderError:
            raise
        except Exception as exc:
            raise RealtimeProviderError("Firebase Realtime Database write failed.", provider=self.provider_name) from exc

    def update(self, path: str, values: dict[str, JSONValue]) -> None:
        try:
            self._reference(path).update(values)
        except RealtimeProviderError:
            raise
        except Exception as exc:
            raise RealtimeProviderError("Firebase Realtime Database update failed.", provider=self.provider_name) from exc

    def delete(self, path: str) -> None:
        try:
            self._reference(path).delete()
        except RealtimeProviderError:
            raise
        except Exception as exc:
            raise RealtimeProviderError("Firebase Realtime Database delete failed.", provider=self.provider_name) from exc


def ensure_realtime_provider(provider: FirebaseRealtimeDataProvider) -> RealtimeDataProvider:
    return provider
