from __future__ import annotations

from datetime import datetime
from typing import Any

from infrastructure.common.exceptions import ObjectStorageError, ProviderUnavailableError
from infrastructure.common.types import ObjectMetadata, ObjectReference
from infrastructure.storage.ports.object_storage import ObjectStorageProvider, StorageAccessReference, UploadRequest, UploadResult


class FirebaseObjectStorageProvider:
    provider_name = "firebase"

    def __init__(self, *, app: Any = None, bucket: Any = None):
        self.app = app
        if bucket is None:
            try:
                from firebase_admin import storage
                bucket = storage.bucket(app=self.app)
            except ImportError as exc:
                raise ProviderUnavailableError("Firebase Storage is unavailable.", provider=self.provider_name) from exc
            except Exception as exc:
                raise ObjectStorageError("Firebase Storage bucket is unavailable.", provider=self.provider_name) from exc
        self.bucket = bucket

    def _blob(self, reference: ObjectReference):
        return self.bucket.blob(self._path(reference))

    @staticmethod
    def _path(reference: ObjectReference) -> str:
        return f"{reference.namespace.rstrip('/')}/{reference.key.lstrip('/')}"

    def upload(self, request: UploadRequest) -> UploadResult:
        try:
            blob = self._blob(request.reference)
            if hasattr(request.content, "read"):
                blob.upload_from_file(request.content, content_type=request.content_type, rewind=True)
            else:
                blob.upload_from_string(request.content, content_type=request.content_type)
            if request.metadata:
                blob.metadata = dict(request.metadata)
                blob.patch()
            return UploadResult(self._metadata(blob, request.reference))
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage upload failed.", provider=self.provider_name) from exc

    def download(self, reference: ObjectReference) -> bytes:
        try:
            return self._blob(reference).download_as_bytes()
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage download failed.", provider=self.provider_name) from exc

    def delete(self, reference: ObjectReference) -> None:
        try:
            self._blob(reference).delete()
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage delete failed.", provider=self.provider_name) from exc

    def exists(self, reference: ObjectReference) -> bool:
        try:
            return bool(self._blob(reference).exists())
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage existence check failed.", provider=self.provider_name) from exc

    def metadata(self, reference: ObjectReference) -> ObjectMetadata:
        try:
            blob = self._blob(reference)
            blob.reload()
            return self._metadata(blob, reference)
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage metadata lookup failed.", provider=self.provider_name) from exc

    def create_access_reference(self, reference: ObjectReference, *, expires_at: datetime) -> StorageAccessReference:
        try:
            url = self._blob(reference).generate_signed_url(expiration=expires_at, method="GET")
            return StorageAccessReference(reference=reference, expires_at=expires_at, url=url)
        except Exception as exc:
            raise ObjectStorageError("Firebase Storage access reference failed.", provider=self.provider_name) from exc

    @staticmethod
    def _metadata(blob: Any, reference: ObjectReference) -> ObjectMetadata:
        return ObjectMetadata(reference=reference, content_type=getattr(blob, "content_type", None), size_bytes=getattr(blob, "size", None), checksum=getattr(blob, "md5_hash", None), metadata=getattr(blob, "metadata", None) or {})


def ensure_storage_provider(provider: FirebaseObjectStorageProvider) -> ObjectStorageProvider:
    return provider
