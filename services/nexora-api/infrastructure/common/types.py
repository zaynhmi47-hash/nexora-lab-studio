from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Mapping, TypeAlias
from uuid import UUID

JSONValue: TypeAlias = None | bool | int | float | str | list["JSONValue"] | dict[str, "JSONValue"]
Metadata: TypeAlias = Mapping[str, str]


@dataclass(frozen=True, slots=True)
class ObjectReference:
    namespace: str
    key: str
    version: str | None = None


@dataclass(frozen=True, slots=True)
class ObjectMetadata:
    reference: ObjectReference
    content_type: str | None = None
    size_bytes: int | None = None
    checksum: str | None = None
    metadata: Metadata = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class MessageTarget:
    kind: str
    value: str


@dataclass(frozen=True, slots=True)
class MessagePayload:
    title: str | None = None
    body: str | None = None
    data: Mapping[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class MessageRequest:
    target: MessageTarget
    payload: MessagePayload


@dataclass(frozen=True, slots=True)
class MessageResult:
    accepted: bool
    provider_message_id: str | None = None
    details: Mapping[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class DomainEvent:
    event_id: UUID
    event_type: str
    aggregate_id: UUID | None
    occurred_at: datetime
    payload: Mapping[str, JSONValue] = field(default_factory=dict)
    metadata: Mapping[str, str] = field(default_factory=dict)
