from datetime import date, timedelta
import logging
from uuid import uuid4

from django.db import transaction
from django.db.models import Count, Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import NexoraUser
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry
from infrastructure.storage.ports.object_storage import UploadRequest

from .api import DatingActiveUserPermission, DatingActionThrottle
from .models import DatingBlock, DatingMoment, DatingMomentComment, DatingMomentReaction, DatingProfile

logger = logging.getLogger(__name__)


class DatingMomentInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatingMoment
        fields = ("caption", "media_url", "visibility")
        extra_kwargs = {
            "caption": {"required": True, "allow_blank": False},
            "media_url": {"required": False, "allow_blank": True},
            "visibility": {"required": False},
        }

    def validate_caption(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Moment text cannot be empty.")
        return value


class DatingMomentView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    image_max_bytes = 10 * 1024 * 1024
    video_max_bytes = 100 * 1024 * 1024
    access_ttl = timedelta(hours=1)

    @staticmethod
    def _media_reference(moment):
        if not moment.storage_key:
            return None
        return ObjectReference(namespace="dating/moments", key=moment.storage_key)

    @classmethod
    def _media_access_url(cls, moment):
        reference = cls._media_reference(moment)
        if reference is None:
            return moment.media_url
        access = FirebaseProviderRegistry().storage().create_access_reference(
            reference, expires_at=timezone.now() + cls.access_ttl
        )
        return access.url or moment.media_url

    @classmethod
    def serialize(cls, moment, *, own=False):
        profile = getattr(moment.author, "dating_profile", None)
        return {
            "id": str(moment.id),
            "author": {
                "id": str(moment.author_id),
                "display_name": profile.display_name if profile else moment.author.display_name,
                "photo_url": profile.photo_url if profile else "",
            },
            "caption": moment.caption,
            "media_url": cls._media_access_url(moment),
            "media_type": moment.media_type or ("image" if moment.media_url else ""),
            "visibility": moment.visibility if own else "public",
            "created_at": moment.created_at.isoformat(),
            "is_own": own,
            "like_count": getattr(moment, "like_count", 0),
            "comment_count": getattr(moment, "comment_count", 0),
            "is_liked_by_me": getattr(moment, "is_liked_by_me", False),
        }

    @staticmethod
    def _validated_upload(upload):
        content_type = (upload.content_type or "").lower().split(";", 1)[0].strip()
        allowed = {
            "image/jpeg": ("image", "jpg", DatingMomentView.image_max_bytes),
            "image/png": ("image", "png", DatingMomentView.image_max_bytes),
            "image/webp": ("image", "webp", DatingMomentView.image_max_bytes),
            "video/mp4": ("video", "mp4", DatingMomentView.video_max_bytes),
            "video/quicktime": ("video", "mov", DatingMomentView.video_max_bytes),
            "video/webm": ("video", "webm", DatingMomentView.video_max_bytes),
        }
        spec = allowed.get(content_type)
        if spec is None:
            raise serializers.ValidationError({"file": "Supported media: JPEG, PNG, WebP, MP4, MOV, and WebM."})
        media_type, extension, max_bytes = spec
        if upload.size <= 0 or upload.size > max_bytes:
            raise serializers.ValidationError({"file": f"File size must be between 1 byte and {max_bytes // (1024 * 1024)} MB."})
        head = upload.read(16)
        upload.seek(0)
        valid_signature = (
            (content_type == "image/jpeg" and head.startswith(b"\\xff\\xd8\\xff"))
            or (content_type == "image/png" and head.startswith(b"\\x89PNG\\r\\n\\x1a\\n"))
            or (content_type == "image/webp" and len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP")
            or (content_type in {"video/mp4", "video/quicktime"} and len(head) >= 8 and head[4:8] == b"ftyp")
            or (content_type == "video/webm" and head.startswith(b"\\x1a\\x45\\xdf\\xa3"))
        )
        if not valid_signature:
            raise serializers.ValidationError({"file": "The uploaded file does not match its declared media format."})
        return media_type, extension, content_type

    def get(self, request):
        try:
            limit = min(30, max(1, int(request.query_params.get("limit", "20"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        blocked = DatingBlock.objects.filter(Q(blocker=request.user) | Q(blocked=request.user))
        blocked_ids = blocked.values_list("blocker_id", flat=True)
        blocked_targets = blocked.values_list("blocked_id", flat=True)
        queryset = DatingMoment.objects.select_related("author", "author__dating_profile").annotate(
            like_count=Count("reactions", filter=Q(reactions__deleted_at__isnull=True), distinct=True),
            comment_count=Count("comments", filter=Q(comments__deleted_at__isnull=True), distinct=True),
            is_liked_by_me=Exists(DatingMomentReaction.objects.filter(moment_id=OuterRef("pk"), user=request.user, deleted_at__isnull=True)),
        ).filter(
            visibility=DatingMoment.Visibility.PUBLIC,
            author__status=NexoraUser.Status.ACTIVE,
            author__dating_profile__discovery_enabled=True,
        ).exclude(author_id__in=blocked_ids).exclude(author_id__in=blocked_targets)
        own_private = DatingMoment.objects.select_related("author", "author__dating_profile").annotate(
            like_count=Count("reactions", filter=Q(reactions__deleted_at__isnull=True), distinct=True),
            comment_count=Count("comments", filter=Q(comments__deleted_at__isnull=True), distinct=True),
            is_liked_by_me=Exists(DatingMomentReaction.objects.filter(moment_id=OuterRef("pk"), user=request.user, deleted_at__isnull=True)),
        ).filter(author=request.user, visibility=DatingMoment.Visibility.PRIVATE)
        public_items = list(queryset.order_by("-created_at")[:limit])
        own_items = list(own_private.order_by("-created_at")[:limit])
        merged = sorted(public_items + own_items, key=lambda item: item.created_at, reverse=True)[:limit]
        return Response({"items": [self.serialize(item, own=item.author_id == request.user.id) for item in merged]})

    def post(self, request):
        profile = DatingProfile.objects.filter(user=request.user).first()
        if not profile or not profile.birth_date:
            return Response({"detail": "Complete your dating profile and verify your age before posting."}, status=status.HTTP_400_BAD_REQUEST)
        today = date.today()
        age = today.year - profile.birth_date.year - ((today.month, today.day) < (profile.birth_date.month, profile.birth_date.day))
        if age < 18:
            return Response({"detail": "Dating Moments are available only to adults aged 18 or older."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DatingMomentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = request.FILES.get("file")
        if upload is not None and serializer.validated_data.get("media_url"):
            return Response({"detail": "Send either a file or media_url, not both."}, status=status.HTTP_400_BAD_REQUEST)

        storage_key = ""
        media_type = ""
        reference = None
        if upload is not None:
            media_type, extension, content_type = self._validated_upload(upload)
            storage_key = f"{request.user.id}/{uuid4()}.{extension}"
            reference = ObjectReference(namespace="dating/moments", key=storage_key)
            try:
                FirebaseProviderRegistry().storage().upload(
                    UploadRequest(
                        reference=reference,
                        content=upload.file,
                        content_type=content_type,
                        metadata={"owner_id": str(request.user.id), "media_type": media_type, "purpose": "dating-moment"},
                    )
                )
            except Exception:
                logger.exception("Dating Moment media upload failed for user %s", request.user.id)
                return Response({"detail": "Media storage is temporarily unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            moment = DatingMoment.objects.create(
                author=request.user,
                storage_key=storage_key,
                media_type=media_type,
                **serializer.validated_data,
            )
        except Exception:
            if reference is not None:
                try:
                    FirebaseProviderRegistry().storage().delete(reference)
                except Exception:
                    logger.exception("Failed to clean up orphaned Dating Moment media: %s", storage_key)
            raise
        return Response(self.serialize(moment, own=True), status=status.HTTP_201_CREATED)

    def delete(self, request):
        moment_id = request.query_params.get("moment_id")
        if not moment_id:
            return Response({"detail": "moment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        moment = DatingMoment.objects.filter(id=moment_id, author=request.user).first()
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        storage_key = moment.storage_key
        moment.soft_delete()
        if storage_key:
            try:
                FirebaseProviderRegistry().storage().delete(
                    ObjectReference(namespace="dating/moments", key=storage_key)
                )
            except Exception:
                logger.exception("Failed to delete Dating Moment media object: %s", storage_key)
        return Response({"status": "deleted"})
