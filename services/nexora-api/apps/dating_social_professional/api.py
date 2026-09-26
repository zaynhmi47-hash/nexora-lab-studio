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
from .services import DatingSafetyService, DatingSwipeService, _compatibility_score, _distance_km, discovery_for


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
        filters = {key: request.query_params.get(key) for key in ("intent", "education", "occupation", "city", "interest", "max_distance_km") if request.query_params.get(key)}
        try:
            cursor = max(0, int(request.query_params.get("cursor", "0")))
            limit = min(50, max(1, int(request.query_params.get("limit", "20"))))
        except (TypeError, ValueError):
            return Response(
                {"detail": "cursor and limit must be valid integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "max_distance_km" in filters:
            try:
                filters["max_distance_km"] = max(1, int(filters["max_distance_km"]))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "max_distance_km must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        profiles = discovery_for(request.user, limit=cursor + limit + 1, **filters)
        page = profiles[cursor:cursor + limit]
        has_more = len(profiles) > cursor + limit
        actor_profile = DatingProfile.objects.filter(user=request.user).first()
        serialized = DatingProfileSerializer(page, many=True).data
        items = []
        for profile, item in zip(page, serialized):
            if actor_profile:
                distance = _distance_km(actor_profile, profile)
                actor_interests = {str(value).strip().casefold() for value in (actor_profile.interests or []) if str(value).strip()}
                candidate_interests = {str(value).strip().casefold() for value in (profile.interests or []) if str(value).strip()}
                shared_interests = sorted(
                    {str(value).strip() for value in (profile.interests or []) if str(value).strip() and str(value).strip().casefold() in actor_interests},
                    key=str.casefold,
                )
                item["compatibility_score"] = _compatibility_score(actor_profile, profile, date.today())
                item["distance_km"] = round(distance, 1) if distance is not None else None
                item["shared_interests"] = shared_interests
            else:
                item["compatibility_score"] = 0
                item["distance_km"] = None
                item["shared_interests"] = []
            items.append(item)
        return Response({"items": items, "next_cursor": str(cursor + limit) if has_more else None})


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
            ordered = list(
                DatingProfileMedia.objects.filter(profile=profile, active=True)
                .order_by("sort_order", "created_at")
            )
            if item not in ordered:
                return Response({"detail": "Media not found."}, status=status.HTTP_404_NOT_FOUND)
            target_index = max(0, min(sort_order, len(ordered) - 1))
            ordered.remove(item)
            ordered.insert(target_index, item)
            now = timezone.now()
            for index, media in enumerate(ordered):
                if media.sort_order != index:
                    media.sort_order = index
                    media.updated_at = now
                    media.save(update_fields=["sort_order", "updated_at"])
        if "is_primary" in request.data:
            item.is_primary = bool(request.data.get("is_primary"))
        item.save(update_fields=["is_primary", "updated_at"])
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



class MeProfileView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        profile, _ = DatingProfile.objects.get_or_create(
            user=request.user,
            defaults={"display_name": getattr(request.user, "display_name", "") or "Nexora User"},
        )
        return Response(DatingProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = DatingProfile.objects.get_or_create(
            user=request.user,
            defaults={"display_name": getattr(request.user, "display_name", "") or "Nexora User"},
        )
        serializer = DatingProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(DatingProfileSerializer(serializer.save()).data)


class SwipeInputSerializer(serializers.Serializer):
    target_profile_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=DatingSwipe.Action.values)


class SwipeView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = SwipeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = DatingProfile.objects.get(id=serializer.validated_data["target_profile_id"], discovery_enabled=True)
            swipe, match = DatingSwipeService.record(actor=request.user, target_profile=target, action=serializer.validated_data["action"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except DatingProfile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "accepted", "swipe_id": str(swipe.id), "matched": match is not None, "match_id": str(match.id) if match else None}, status=status.HTTP_201_CREATED)


class MatchesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        matches = DatingMatch.objects.filter(active=True).filter(Q(user_a=request.user) | Q(user_b=request.user)).select_related("user_a", "user_b").order_by("-matched_at")
        return Response({"items": [{"id": str(m.id), "userA": str(m.user_a_id), "userB": str(m.user_b_id), "matchedAt": m.matched_at.isoformat()} for m in matches]})


class BlockInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()


class BlockView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = BlockInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = NexoraUser.objects.filter(id=serializer.validated_data["target_user_id"]).first()
        if not target:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            DatingSafetyService.block(actor=request.user, target=target)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "blocked"})


class ReportInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()
    reason = serializers.CharField(max_length=80)
    details = serializers.CharField(max_length=2000, required=False, allow_blank=True)


class ReportView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = ReportInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = NexoraUser.objects.filter(id=serializer.validated_data["target_user_id"]).first()
        if not target:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            report = DatingSafetyService.report(actor=request.user, target=target, reason=serializer.validated_data["reason"], details=serializer.validated_data.get("details", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class MatchLifecycleView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, match_id):
        try:
            DatingSafetyService.unmatch(actor=request.user, match_id=match_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "unmatched"})


class ConversationInputSerializer(serializers.Serializer):
    match_id = serializers.UUIDField()


class ConversationView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = ConversationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            conversation = DatingConversationService.get_or_create_for_user(actor=request.user, match_id=serializer.validated_data["match_id"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id), "active": conversation.active}, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match", "match__user_a", "match__user_b").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart = conversation.match.user_b if conversation.match.user_a_id == request.user.id else conversation.match.user_a
        profile = DatingProfile.objects.filter(user=counterpart).first()
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id), "active": conversation.active, "counterpart": DatingProfileSerializer(profile).data if profile else None})


class MessageInputSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=4000, trim_whitespace=True)


class ConversationMessagesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        messages = DatingMessage.objects.filter(conversation=conversation).order_by("created_at")
        return Response({"items": [{"id": str(m.id), "senderId": str(m.sender_id), "body": m.body, "createdAt": m.created_at.isoformat(), "readAt": m.read_at.isoformat() if m.read_at else None} for m in messages]})

    def post(self, request, conversation_id):
        try:
            message = DatingConversationService.send(actor=request.user, conversation_id=conversation_id, body=str(request.data.get("body", "")))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"id": str(message.id), "senderId": str(message.sender_id), "body": message.body, "createdAt": message.created_at.isoformat(), "readAt": message.read_at.isoformat() if message.read_at else None}, status=status.HTTP_201_CREATED)


class ConversationReadView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        try:
            updated = DatingConversationService.mark_read(actor=request.user, conversation_id=conversation_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "read", "updated": updated})


class ConversationBlockView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        target_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        try:
            DatingSafetyService.block(actor=request.user, target=NexoraUser.objects.get(id=target_id))
        except (ValueError, NexoraUser.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "blocked"})


class ConversationReportView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        target_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        try:
            report = DatingSafetyService.report(actor=request.user, target=NexoraUser.objects.get(id=target_id), reason=str(request.data.get("reason", "other")), details=str(request.data.get("details", "")))
        except (ValueError, NexoraUser.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class NotificationView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        items = DatingNotification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
        unread = DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).count()
        return Response({"items": [{"id": str(n.id), "type": n.notification_type, "title": n.title, "body": n.body, "data": n.data, "createdAt": n.created_at.isoformat(), "readAt": n.read_at.isoformat() if n.read_at else None} for n in items], "unreadCount": unread})

    def post(self, request):
        updated = DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"status": "read", "updated": updated})


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatingNotificationPreference
        fields = ("push_enabled", "match_push_enabled", "message_push_enabled", "safety_push_enabled")


class NotificationPreferencesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        preference, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(preference).data)

    def patch(self, request):
        preference, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(NotificationPreferenceSerializer(serializer.save()).data)


class PushTokenView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        token = str(request.data.get("token", "")).strip()
        platform = str(request.data.get("platform", "")).strip()
        if not token or not platform:
            return Response({"detail": "token and platform are required."}, status=status.HTTP_400_BAD_REQUEST)
        push_token, _ = DatingPushToken.objects.update_or_create(user=request.user, token=token, defaults={"platform": platform, "active": True})
        return Response({"id": str(push_token.id), "status": "registered"}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        token = str(request.data.get("token", "")).strip()
        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)
        DatingPushToken.objects.filter(user=request.user, token=token).update(active=False)
        return Response({"status": "unregistered"})


class ConversationPresenceView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        presence, _ = DatingConversationPresence.objects.get_or_create(user=request.user)
        presence.conversation = conversation
        presence.active = True
        presence.last_seen_at = timezone.now()
        presence.save(update_fields=["conversation", "active", "last_seen_at", "updated_at"])
        return Response({"status": "active"})

    def delete(self, request, conversation_id):
        DatingConversationPresence.objects.filter(user=request.user, conversation_id=conversation_id).update(active=False, last_seen_at=timezone.now(), updated_at=timezone.now())
        return Response({"status": "inactive"})
