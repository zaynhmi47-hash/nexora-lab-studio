from typing import Protocol

from infrastructure.common.types import MessageRequest, MessageResult


class MessagingProvider(Protocol):
    provider_name: str

    def send(self, request: MessageRequest) -> MessageResult: ...
