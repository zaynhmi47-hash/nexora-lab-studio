from __future__ import annotations

from typing import Protocol

from infrastructure.common.types import JSONValue


class RealtimeDataProvider(Protocol):
    provider_name: str

    def get(self, path: str) -> JSONValue: ...
    def set(self, path: str, value: JSONValue) -> None: ...
    def update(self, path: str, values: dict[str, JSONValue]) -> None: ...
    def delete(self, path: str) -> None: ...
