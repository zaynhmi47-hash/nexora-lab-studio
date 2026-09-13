from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import BinaryIO, Mapping, Protocol

from infrastructure.common.types import ObjectMetadata, ObjectReference


@dataclass(frozen=True, slots=True)
class UploadRequest:
    reference: ObjectReference
    content: bytes | BinaryIO
    content_type: str | None = None
    metadata: Mapping[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class UploadResult:
    metadata: ObjectMetadata


@dataclass(frozen=True, slots=True)
class StorageAccessReference:
    reference: ObjectReference
    expires_at: datetime | None = None
    url: str | None = None


class ObjectStorageProvider(Protocol):
    provider_name: str
    def upload(self, request: UploadRequest) -> UploadResult: ...
    def download(self, reference: ObjectReference) -> bytes: ...
    def delete(self, reference: ObjectReference) -> None: ...
    def exists(self, reference: ObjectReference) -> bool: ...
    def metadata(self, reference: ObjectReference) -> ObjectMetadata: ...
    def create_access_reference(self, reference: ObjectReference, *, expires_at: datetime) -> StorageAccessReference: ...
