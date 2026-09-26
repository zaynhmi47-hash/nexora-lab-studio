from datetime import date, timedelta
from uuid import uuid4

from django.utils import timezone
from django.db.models import Q

from rest_framework import serializers, status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry
from infrastructure.storage.ports.object_storage import UploadRequest

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingConversation, DatingConversationPresence, DatingMatch, DatingNotification, DatingNotificationPreference, DatingProfile, DatingProfileMedia, DatingPushToken, DatingSwipe
from .models.safety import DatingReport
from .conversation_service import DatingConversationService
from .services import DatingSafetyService, DatingSwipeService, discovery_for


class DatingProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = DatingProfile
        fields = ("id", "display_name", "birth_date", "age", "bio", "photo_url", "relationship_intent", "discovery_enabled", "preferred_min_age", "preferred_max_age", "interests", "education", "occupation", "location_city", "location_country", "max_distance_km", "profile_completion")

    def get_profile_completion(self, obj):
        checks = [bool(obj.display_name.strip()), bool(obj.birth_date), bool(obj.bio.strip()), bool(obj.photo_url.strip()), bool(obj.relationship_intent), bool(obj.interests), bool(obj.education.strip()), bool(obj.occupation.strip()), bool(obj.location_city.strip())]
        return round(sum(checks) / len(checks) * 100)

    def get_age(self, obj):
        if not obj.birth_date:
            return None
        today = date.today()
        return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))


class DiscoveryView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        filters = {key: request.query_params.get(key) for key in ("intent", "education", "occupation", "city", "interest") if request.query_params.get(key)}
        return Response({"items": DatingProfileSerializer(discovery_for(request.user, **filters), many=True).data, "next_cursor": None})


class ProfileDetailView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, profile_id):
        profile = DatingProfile.objects.filter(
            id=profile_id,
            discovery_enabled=True,
            user__status__in=[NexoraUser.Status.ACTIVE],
        ).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if profile.user_id == request.user.id:
            return Response(DatingProfileSerializer(profile).data)
        blocked = DatingBlock.objects.filter(
            Q(blocker=request.user, blocked=profile.user) | Q(blocker=profile.user, blocked=request.user)
        ).exists()
        if blocked:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DatingProfileSerializer(profile).data)


class ProfileMediaInputSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=2048, required=False, allow_blank=True)
    media_type = serializers.ChoiceField(choices=["image"], required=False, default="image")
    sort_order = serializers.IntegerField(min_value=0, max_value=20, required=False, default=0)
    is_primary = serializers.BooleanField(required=False, default=False)


class ProfileMediaView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    max_upload_size = 10 * 1024 * 1024
    access_ttl = timedelta(hours=1)

    @staticmethod
    def _serialize(item, *, access_url=None):
        return {
            "id": str(item.id),
            "url": access_url or item.url,
            "mediaType": item.media_type,
            "sortOrder": item.sort_order,
            "isPrimary": item.is_primary,
        }

    @classmethod
    def _access_url(cls, item):
        if not item.storage_key:
            return item.url
        reference = ObjectReference(namespace="dating/profile-media", key=item.storage_key)
        access = FirebaseProviderRegistry().storage().create_access_reference(
            reference,
            expires_at=timezone.now() + cls.access_ttl,
        )
        return access.url or item.url

    def get(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, discovery_enabled=True).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if DatingBlock.objects.filter(
            Q(blocker=request.user, blocked=profile.user) | Q(blocker=profile.user, blocked=request.user)
        ).exists():
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        items = DatingProfileMedia.objects.filter(profile=profile, active=True).order_by("sort_order", "created_at")
        return Response({"items": [self._serialize(item, access_url=self._access_url(item)) for item in items]})

    def post(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, user=request.user).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if DatingProfileMedia.objects.filter(profile=profile, active=True).count() >= 6:
            return Response({"detail": "A profile can have at most 6 media items."}, status=status.HTTP_400_BAD_REQUEST)

        upload = request.FILES.get("file")
        if upload is not None:
            if not upload.content_type or not upload.content_type.startswith("image/"):
                return Response({"detail": "Only image uploads are supported."}, status=status.HTTP_400_BAD_REQUEST)
            if upload.size > self.max_upload_size:
                return Response({"detail": "Image uploads must be 10 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
            media_id = uuid4()
            extension = (upload.name.rsplit(".", 1)[-1].lower() if "." in upload.name else "bin")[:12]
            storage_key = f"{profile.id}/{media_id}.{extension}"
            reference = ObjectReference(namespace="dating/profile-media", key=storage_key)
            FirebaseProviderRegistry().storage().upload(
                UploadRequest(
                    reference=reference,
                    content=upload.file,
                    content_type=upload.content_type,
                    metadata={"profile_id": str(profile.id), "media_id": str(media_id), "media_type": "image"},
                )
            )
            item = DatingProfileMedia.objects.create(
                id=media_id,
                profile=profile,
                url="",
                storage_key=storage_key,
                media_type="image",
                sort_order=DatingProfileMedia.objects.filter(profile=profile, active=True).count(),
                is_primary=not DatingProfileMedia.objects.filter(profile=profile, active=True).exists(),
            )
        else:
            serializer = ProfileMediaInputSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            if not serializer.validated_data["url"]:
                return Response({"detail": "url or file is required."}, status=status.HTTP_400_BAD_REQUEST)
            item = DatingProfileMedia.objects.create(
                profile=profile,
                url=serializer.validated_data["url"],
                media_type=serializer.validated_data["media_type"],
                sort_order=serializer.validated_data["sort_order"],
                is_primary=serializer.validated_data["is_primary"],
            )

        if item.is_primary:
            DatingProfileMedia.objects.filter(profile=profile).exclude(id=item.id).update(is_primary=False)
            profile.photo_url = item.url
            if item.storage_key:
                profile.photo_url = ""
            profile.save(update_fields=["photo_url", "updated_at"])
        return Response(self._serialize(item, access_url=self._access_url(item)), status=status.HTTP_201_CREATED)

    def patch(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, user=request.user).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        media_id = request.data.get("media_id")
        item = DatingProfileMedia.objects.filter(id=media_id, profile=profile, active=True).first()
        if not item:
            return Response({"detail": "Media not found."}, status=status.HTTP_404_NOT_FOUND)
        sort_order = request.data.get("sort_order")
        if sort_order is not None:
            try:
                sort_order = int(sort_order)
            except (TypeError, ValueError):
                return Response({"detail": "sort_order must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
            if not 0 <= sort_order <= 20:
                return Response({"detail": "sort_order must be between 0 and 20."}, status=status.HTTP_400_BAD_REQUEST)
            item.sort_order = sort_order
        if "is_primary" in request.data:
            item.is_primary = bool(request.data.get("is_primary"))
        item.save(update_fields=["sort_order", "is_primary", "updated_at"])
        if item.is_primary:
            DatingProfileMedia.objects.filter(profile=profile).exclude(id=item.id).update(is_primary=False)
            profile.photo_url = item.url if not item.storage_key else ""
            profile.save(update_fields=["photo_url", "updated_at"])
        return Response(self._serialize(item, access_url=self._access_url(item)))

    def delete(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, user=request.user).first()
        media_id = request.query_params.get("media_id")
        item = DatingProfileMedia.objects.filter(id=media_id, profile=profile, active=True).first() if profile else None
        if not item:
            return Response({"detail": "Media not found."}, status=status.HTTP_404_NOT_FOUND)
        was_primary = item.is_primary
        item.active = False
        item.is_primary = False
        item.save(update_fields=["active", "is_primary", "updated_at"])
        if item.storage_key:
            try:
                FirebaseProviderRegistry().storage().delete(
                    ObjectReference(namespace="dating/profile-media", key=item.storage_key)
                )
            except Exception:
                pass
        if was_primary:
            replacement = DatingProfileMedia.objects.filter(profile=profile, active=True).order_by("sort_order", "created_at").first()
            if replacement:
                replacement.is_primary = True
                replacement.save(update_fields=["is_primary", "updated_at"])
                profile.photo_url = replacement.url if not replacement.storage_key else ""
                profile.save(update_fields=["photo_url", "updated_at"])
            else:
                profile.photo_url = ""
                profile.save(update_fields=["photo_url", "updated_at"])
        return Response({"status": "deleted"})

