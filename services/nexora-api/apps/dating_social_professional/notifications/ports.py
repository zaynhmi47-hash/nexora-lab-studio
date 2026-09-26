from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PushMessage:
    token: str
    title: str
    body: str
    data: dict


@dataclass(frozen=True)
class PushDeliveryResult:
    token: str
    accepted: bool
    invalid_token: bool = False


class PushProvider(Protocol):
    def send(self, messages: list[PushMessage]) -> list[PushDeliveryResult]:
        ...
