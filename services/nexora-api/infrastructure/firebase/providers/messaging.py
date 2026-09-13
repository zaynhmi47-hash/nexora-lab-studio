from __future__ import annotations

from typing import Any

from infrastructure.common.exceptions import MessagingError, ProviderUnavailableError
from infrastructure.common.types import MessageRequest, MessageResult
from infrastructure.messaging.ports.messaging_provider import MessagingProvider


class FirebaseMessagingProvider:
    provider_name = "firebase"

    def __init__(self, *, app: Any = None, messaging_client: Any = None):
        self.app = app
        if messaging_client is None:
            try:
                from firebase_admin import messaging
            except ImportError as exc:
                raise ProviderUnavailableError("Firebase Cloud Messaging is unavailable.", provider=self.provider_name) from exc
            messaging_client = messaging
        self.messaging_client = messaging_client

    def send(self, request: MessageRequest) -> MessageResult:
        target = request.target
        if target.kind not in {"device", "token", "topic"}:
            raise MessagingError("Firebase messaging target kind is unsupported.", provider=self.provider_name)
        try:
            kwargs = {"data": dict(request.payload.data)}
            if target.kind in {"device", "token"}:
                kwargs["token"] = target.value
            else:
                kwargs["topic"] = target.value
            if request.payload.title or request.payload.body:
                kwargs["notification"] = self.messaging_client.Notification(title=request.payload.title, body=request.payload.body)
            message = self.messaging_client.Message(**kwargs)
            message_id = self.messaging_client.send(message, app=self.app)
            return MessageResult(accepted=True, provider_message_id=message_id)
        except Exception as exc:
            raise MessagingError("Firebase message delivery failed.", provider=self.provider_name) from exc


def ensure_messaging_provider(provider: FirebaseMessagingProvider) -> MessagingProvider:
    return provider
