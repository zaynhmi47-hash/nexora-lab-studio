from __future__ import annotations

from datetime import timedelta
from pathlib import PurePath
from uuid import uuid4
import re

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry

from .assets import NexverseUploadSession
from .models import NexverseWork


MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_ACTIVE_UPLOADS = 5
MAX_LIBRARY_ITEMS = 100
ALLOWED_ASSETS = {
    NexverseUploadSession.AssetType.MANUSCRIPT: {
        "application/pdf": {".pdf"},
        "application/epub+zip": {".epub"},
        "text/plain": {".txt"},
    },
    NexverseUploadSession.AssetType.COVER: {
        "image/jpeg": {".jpg", ".jpeg"},
        "image/png": {".png"},
        "image/webp": {".webp"},
    },
    NexverseUploadSession.AssetType.ATTACHMENT: {
        "application/pdf": {".pdf"},
        "image/jpeg": {".jpg", ".jpeg"},
        "image/png": {".png"},
    },
}


def _firebase_uid(user):
    account = user.provider_accounts.filter(provider="firebase").only("provider_subject").first()
    return account.provider_subject if account else None


def _safe_filename(value: str) -> str:
    name = PurePath(value.replace("\\\\", "/")).name.strip()
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name)[:180].strip(".-")
    return name or "upload"


def _session_payload(session):
    return {
        "id": str(session.id),
        "assetType": session.asset_type,
        "filename": session.original_filename,
        "contentType": session.content_type,
        "expectedSizeBytes": session.expected_size_bytes,
        "uploadedSizeBytes": session.uploaded_size_bytes,
        "checksum": session.checksum_md5 or None,
        "storagePath": session.storage_path,
        "status": session.status,
        "expiresAt": session.expires_at.isoformat(),
        "createdAt": session.created_at.isoformat(),
        "uploadedAt": session.uploaded_at.isoformat() if session.uploaded_at else None,
    }


class NexverseUploadSessionListCreateView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, work_id):
        work = NexverseWork.objects.filter(
            pk=work_id, author__user=request.user, deleted_at__isnull=True
        ).first()
        if work is None:
            return Response({"detail": "Work not found."}, status=404)

        sessions = NexverseUploadSession.objects.filter(
            work=work, owner=request.user, deleted_at__isnull=True
        )
        asset_type = request.query_params.get("assetType")
        if asset_type:
            if asset_type not in NexverseUploadSession.AssetType.values:
                return Response(
                    {"detail": "Unknown asset type.", "code": "INVALID_ASSET_TYPE"},
                    status=400,
                )
            sessions = sessions.filter(asset_type=asset_type)

        upload_status = request.query_params.get("status")
        if upload_status:
            if upload_status not in NexverseUploadSession.Status.values:
                return Response(
                    {"detail": "Unknown upload status.", "code": "INVALID_UPLOAD_STATUS"},
                    status=400,
                )
            sessions = sessions.filter(status=upload_status)

        items = list(sessions.order_by("-created_at")[:MAX_LIBRARY_ITEMS])
        counts = {
            value: NexverseUploadSession.objects.filter(
                work=work,
                owner=request.user,
                deleted_at__isnull=True,
                status=value,
            ).count()
            for value, _label in NexverseUploadSession.Status.choices
        }
        return Response({
            "items": [_session_payload(item) for item in items],
            "counts": counts,
            "limit": MAX_LIBRARY_ITEMS,
        })

    def post(self, request, work_id):
        work = NexverseWork.objects.filter(pk=work_id, author__user=request.user).first()
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        if work.review_status == NexverseWork.ReviewStatus.SUBMITTED or work.status != NexverseWork.Status.DRAFT:
            return Response({"detail": "Only draft works can receive new uploads."}, status=409)

        uid = _firebase_uid(request.user)
        if not uid:
            return Response({"detail": "Firebase identity is not linked to this Nexora account.", "code": "FIREBASE_IDENTITY_MISSING"}, status=409)

        asset_type = request.data.get("assetType")
        content_type = str(request.data.get("contentType", "")).lower().strip()
        filename = _safe_filename(str(request.data.get("filename", "")))
        try:
            size_bytes = int(request.data.get("sizeBytes", 0))
        except (TypeError, ValueError):
            size_bytes = 0

        rules = ALLOWED_ASSETS.get(asset_type)
        extension = PurePath(filename).suffix.lower()
        if not rules or extension not in rules.get(content_type, set()):
            return Response({"detail": "File type is not allowed for this asset.", "code": "UNSUPPORTED_FILE_TYPE"}, status=400)
        if size_bytes < 1 or size_bytes > MAX_UPLOAD_BYTES:
            return Response({"detail": "File size must be between 1 byte and 50 MB.", "code": "FILE_SIZE_LIMIT"}, status=400)

        now = timezone.now()
        active_uploads = NexverseUploadSession.objects.filter(
            owner=request.user,
            status=NexverseUploadSession.Status.CREATED,
            expires_at__gt=now,
            deleted_at__isnull=True,
        ).count()
        if active_uploads >= MAX_ACTIVE_UPLOADS:
            return Response({"detail": "You already have five active uploads. Complete or wait for an existing session to expire.", "code": "ACTIVE_UPLOAD_LIMIT"}, status=429)

        session_id = uuid4()
        expires_at = now + timedelta(minutes=20)
        storage_path = f"nexverse/{uid}/uploads/{session_id}/{filename}"
        session = NexverseUploadSession.objects.create(
            id=session_id,
            work=work,
            owner=request.user,
            asset_type=asset_type,
            original_filename=filename,
            content_type=content_type,
            expected_size_bytes=size_bytes,
            storage_path=storage_path,
            expires_at=expires_at,
        )
        return Response(_session_payload(session), status=status.HTTP_201_CREATED)


class NexverseUploadCompleteView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = NexverseUploadSession.objects.filter(
            pk=session_id, owner=request.user, work__author__user=request.user,
            deleted_at__isnull=True,
        ).select_related("work").first()
        if session is None:
            return Response({"detail": "Upload session not found."}, status=404)
        if session.status == NexverseUploadSession.Status.UPLOADED:
            return Response(_session_payload(session))
        if session.status != NexverseUploadSession.Status.CREATED:
            return Response({"detail": "Upload session is not active.", "code": "UPLOAD_SESSION_INACTIVE"}, status=409)
        if session.expires_at <= timezone.now():
            session.status = NexverseUploadSession.Status.EXPIRED
            session.save(update_fields=("status", "updated_at"))
            return Response({"detail": "Upload session expired. Start a new upload.", "code": "UPLOAD_SESSION_EXPIRED"}, status=410)

        reference = ObjectReference(namespace="nexverse", key=session.storage_path.removeprefix("nexverse/"))
        try:
            metadata = FirebaseProviderRegistry().storage().metadata(reference)
        except Exception:
            return Response({"detail": "File was not found in Firebase Storage yet.", "code": "UPLOAD_OBJECT_NOT_FOUND"}, status=409)

        if metadata.size_bytes != session.expected_size_bytes or metadata.content_type != session.content_type:
            session.status = NexverseUploadSession.Status.REJECTED
            session.save(update_fields=("status", "updated_at"))
            return Response({"detail": "Uploaded object metadata does not match the upload session.", "code": "UPLOAD_METADATA_MISMATCH"}, status=400)

        session.status = NexverseUploadSession.Status.UPLOADED
        session.uploaded_size_bytes = metadata.size_bytes
        session.checksum_md5 = metadata.checksum or ""
        session.uploaded_at = timezone.now()
        session.save(update_fields=("status", "uploaded_size_bytes", "checksum_md5", "uploaded_at", "updated_at"))
        return Response(_session_payload(session), status=200)
