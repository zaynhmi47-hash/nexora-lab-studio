from datetime import date, timedelta
from uuid import uuid4
import hashlib
import json
import logging

from django.utils import timezone
from django.core import signing
from django.db import transaction
from django.db.models import Q

from rest_framework import serializers, status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry
from infrastructure.storage.ports.object_storage import UploadRequest

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingConversation, DatingConversationPresence, DatingMatch, DatingMessage, DatingNotification, DatingNotificationPreference, DatingProfile, DatingProfileMedia, DatingPushToken, DatingSwipe
from .models.safety import DatingReport
from .conversation_service import DatingConversationService
from .services import DatingSafetyService, DatingSwipeService, _compatibility_score, _distance_km, ranked_discovery_for


logger = logging.getLogger(__name__)


class DatingActionThrottle(UserRateThrottle):
    rate = "30/min"


class DatingMessageThrottle(UserRateThrottle):
    rate = "20/min"


class DatingPushThrottle(UserRateThrottle):
    rate = "10/min"


class DatingActiveUserPermission(AuthenticatedNexoraUserPermission):
    message = "An active Nexora account is required."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and getattr(request.user, "status", None) == NexoraUser.Status.ACTIVE


class DatingProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = DatingProfile
        fields = ("id", "display_name", "birth_date", "age", "bio", "photo_url", "relationship_intent", "discovery_enabled", "preferred_min_age", "preferred_max_age", "interests", "education", "occupation", "location_city", "location_country", "max_distance_km", "profile_completion")

    def validate(self, attrs):
        birth_date = attrs.get("birth_date", getattr(self.instance, "birth_date", None))
        if birth_date:
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age < 18:
                raise serializers.ValidationError({"birth_date": "Dating profiles require an age of at least 18."})
            if birth_date > today:
                raise serializers.ValidationError({"birth_date": "Birth date cannot be in the future."})

        minimum = attrs.get("preferred_min_age", getattr(self.instance, "preferred_min_age", 18))
        maximum = attrs.get("preferred_max_age", getattr(self.instance, "preferred_max_age", 99))
        if minimum < 18 or maximum > 99 or minimum > maximum:
            raise serializers.ValidationError({"preferred_min_age": "Preferred age range must be between 18 and 99, with minimum no greater than maximum."})
        return attrs

    def get_profile_completion(self, obj):
        active_media = getattr(obj, "_active_media", None)
        has_photo = bool(obj.photo_url.strip()) or (active_media is not None and bool(active_media)) or (active_media is None and DatingProfileMedia.objects.filter(profile=obj, active=True).exists())\n        checks = [bool(obj.display_name.strip()), bool(obj.birth_date), bool(obj.bio.strip()), has_photo, bool(obj.relationship_intent), bool(obj.interests), bool(obj.education.strip()), bool(obj.occupation.strip()), bool(obj.location_city.strip())]
        return round(sum(checks) / len(checks) * 100)

    def get_age(self, obj):
        if not obj.birth_date:
            return None
        today = date.today()
        return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))


class DiscoveryView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        filters = {key: request.query_params.get(key) for key in ("intent", "education", "occupation", "city", "interest", "max_distance_km") if request.query_params.get(key)}
        try:
            limit = min(50, max(1, int(request.query_params.get("limit", "20"))))
        except (TypeError, ValueError):
            return Response(
                {"detail": "limit must be a valid integer."},
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
        filter_hash = hashlib.sha256(
            json.dumps(filters, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        cursor_token = request.query_params.get("cursor")
        cursor_key = None
        if cursor_token:
            try:
                payload = signing.loads(cursor_token, salt="dating-discovery-v1", max_age=86400)
                if payload.get("filter_hash") != filter_hash:
                    raise signing.BadSignature("filter mismatch")
                cursor_key = (float(payload["score"]), str(payload["updated_at"]), str(payload["id"]))
            except (signing.BadSignature, signing.SignatureExpired, KeyError, TypeError, ValueError):
                return Response({"detail": "cursor is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        ranked = ranked_discovery_for(request.user, **filters)
        if cursor_key:
            from django.utils.dateparse import parse_datetime
            cursor_updated_at = parse_datetime(cursor_key[1])
            if cursor_updated_at is None:
                return Response({"detail": "cursor is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
            cursor_sort_key = (-cursor_key[0], -cursor_updated_at.timestamp(), cursor_key[2])
            ranked = [
                pair for pair in ranked
                if (-pair[0], -pair[1].updated_at.timestamp(), str(pair[1].id)) > cursor_sort_key
            ]
        page_ranked = ranked[:limit + 1]
        page = [profile for _, profile in page_ranked[:limit]]
        has_more = len(page_ranked) > limit
        next_cursor = None
        if has_more and page_ranked:
            last_score, last_profile = page_ranked[limit - 1]
            next_cursor = signing.dumps(
                {
                    "v": 1,
                    "score": last_score,
                    "updated_at": last_profile.updated_at.isoformat(),
                    "id": str(last_profile.id),
                    "filter_hash": filter_hash,
                },
                salt="dating-discovery-v1",
            )
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
        return Response({"items": items, "next_cursor": next_cursor})


class ProfileDetailView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request, profile_id):
        profile = DatingProfile.objects.filter(
            id=profile_id,
            user__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not profile or (profile.user_id != request.user.id and not profile.discovery_enabled):
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
    permission_classes = [DatingActiveUserPermission]
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
        profile = DatingProfile.objects.filter(
            id=profile_id,
            user__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not profile or (profile.user_id != request.user.id and not profile.discovery_enabled):
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if profile.user_id != request.user.id and DatingBlock.objects.filter(
            Q(blocker=request.user, blocked=profile.user) | Q(blocker=profile.user, blocked=request.user)
        ).exists():
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        items = DatingProfileMedia.objects.filter(profile=profile, active=True).order_by("sort_order", "created_at")
        return Response({"items": [self._serialize(item, access_url=self._access_url(item)) for item in items]})

    def post(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, user=request.user).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        upload = request.FILES.get("file")
        if upload is not None:
            allowed_types = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
            extension = allowed_types.get(upload.content_type)
            if not extension:
                return Response({"detail": "Only JPEG, PNG, and WebP images are supported."}, status=status.HTTP_400_BAD_REQUEST)
            if upload.size > self.max_upload_size:
                return Response({"detail": "Image uploads must be 10 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
            media_id = uuid4()
            storage_key = f"{profile.id}/{media_id}.{extension}"
            reference = ObjectReference(namespace="dating/profile-media", key=storage_key)
            with transaction.atomic():
                locked_profile = DatingProfile.objects.select_for_update().get(pk=profile.pk)
                active_media = DatingProfileMedia.objects.filter(profile=locked_profile, active=True)
                if active_media.count() >= 6:
                    return Response({"detail": "A profile can have at most 6 media items."}, status=status.HTTP_400_BAD_REQUEST)
                sort_order = active_media.count()
                is_primary = not active_media.exists()
                FirebaseProviderRegistry().storage().upload(
                    UploadRequest(
                        reference=reference,
                        content=upload.file,
                        content_type=upload.content_type,
                        metadata={"profile_id": str(profile.id), "media_id": str(media_id), "media_type": "image"},
                    )
                )
                try:
                    item = DatingProfileMedia.objects.create(
                        id=media_id,
                        profile=locked_profile,
                        url="",
                        storage_key=storage_key,
                        media_type="image",
                        sort_order=sort_order,
                        is_primary=is_primary,
                    )
                except Exception:
                    try:
                        FirebaseProviderRegistry().storage().delete(reference)
                    except Exception:
                        logger.warning("Failed to clean up dating profile media object after DB failure: %s", storage_key, exc_info=True)
                    raise
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
                logger.warning("Failed to delete dating profile media object: %s", item.storage_key, exc_info=True)
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
    permission_classes = [DatingActiveUserPermission]

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
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request):
        serializer = SwipeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = DatingProfile.objects.get(
                id=serializer.validated_data["target_profile_id"],
                discovery_enabled=True,
                user__status=NexoraUser.Status.ACTIVE,
            )
            swipe, match = DatingSwipeService.record(actor=request.user, target_profile=target, action=serializer.validated_data["action"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except DatingProfile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "accepted", "swipe_id": str(swipe.id), "matched": match is not None, "match_id": str(match.id) if match else None}, status=status.HTTP_201_CREATED)


class MatchesView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        matches = DatingMatch.objects.filter(
            active=True,
            user_a__status=NexoraUser.Status.ACTIVE,
            user_b__status=NexoraUser.Status.ACTIVE,
        ).filter(Q(user_a=request.user) | Q(user_b=request.user)).select_related("user_a", "user_b").order_by("-matched_at")
        blocked_pairs = DatingBlock.objects.filter(Q(blocker=request.user) | Q(blocked=request.user)).values_list("blocker_id", "blocked_id")
        blocked_ids = {user_id for pair in blocked_pairs for user_id in pair} - {request.user.id}
        matches = [m for m in matches if (m.user_b_id if m.user_a_id == request.user.id else m.user_a_id) not in blocked_ids]
        counterpart_ids = [
            m.user_b_id if m.user_a_id == request.user.id else m.user_a_id
            for m in matches
        ]
        profiles = {
            p.user_id: p
            for p in DatingProfile.objects.filter(user_id__in=counterpart_ids)
        }
        conversations = {
            conversation.match_id: conversation
            for conversation in DatingConversation.objects.filter(match_id__in=[m.id for m in matches], active=True)
        }
        last_messages = {}
        unread_counts = {}
        conversation_ids = [conversation.id for conversation in conversations.values()]
        for message in DatingMessage.objects.filter(conversation_id__in=conversation_ids).order_by("conversation_id", "-created_at"):
            last_messages.setdefault(message.conversation_id, message)
            if message.sender_id != request.user.id and message.read_at is None:
                unread_counts[message.conversation_id] = unread_counts.get(message.conversation_id, 0) + 1
        items = []
        for match in matches:
            counterpart_id = match.user_b_id if match.user_a_id == request.user.id else match.user_a_id
            profile = profiles.get(counterpart_id)
            conversation = conversations.get(match.id)
            last_message = last_messages.get(conversation.id) if conversation else None
            items.append({
                "id": str(match.id),
                "userA": str(match.user_a_id),
                "userB": str(match.user_b_id),
                "matchedAt": match.matched_at.isoformat(),
                "counterpart": DatingProfileSerializer(profile).data if profile else None,
                "conversationId": str(conversation.id) if conversation else None,
                "lastMessage": {
                    "body": last_message.body,
                    "createdAt": last_message.created_at.isoformat(),
                    "senderId": str(last_message.sender_id),
                } if last_message else None,
                "unreadCount": unread_counts.get(conversation.id, 0) if conversation else 0,
            })
        return Response({"items": items})


class BlockInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()


class BlockView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request):
        serializer = BlockInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = NexoraUser.objects.filter(
            id=serializer.validated_data["target_user_id"],
            status=NexoraUser.Status.ACTIVE,
        ).first()
        if not target:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            DatingSafetyService.block(actor=request.user, target=target)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "blocked"})


class ReportInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()
    reason = serializers.ChoiceField(choices=DatingReport.Reason.choices)
    details = serializers.CharField(max_length=2000, required=False, allow_blank=True)


class ReportView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request):
        serializer = ReportInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = NexoraUser.objects.filter(
            id=serializer.validated_data["target_user_id"],
            status=NexoraUser.Status.ACTIVE,
        ).first()
        if not target:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            report = DatingSafetyService.report(actor=request.user, target=target, reason=serializer.validated_data["reason"], details=serializer.validated_data.get("details", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class MatchLifecycleView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request, match_id):
        try:
            DatingSafetyService.unmatch(actor=request.user, match_id=match_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "unmatched"})


class ConversationInputSerializer(serializers.Serializer):
    match_id = serializers.UUIDField()


class ConversationView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request):
        serializer = ConversationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            conversation = DatingConversationService.get_or_create_for_user(actor=request.user, match_id=serializer.validated_data["match_id"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id), "active": conversation.active}, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match", "match__user_a", "match__user_b").filter(
            id=conversation_id,
            active=True,
            match__active=True,
            match__user_a__status=NexoraUser.Status.ACTIVE,
            match__user_b__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart = conversation.match.user_b if conversation.match.user_a_id == request.user.id else conversation.match.user_a
        if DatingBlock.objects.filter(
            Q(blocker=request.user, blocked=counterpart) | Q(blocker=counterpart, blocked=request.user)
        ).exists():
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        profile = DatingProfile.objects.filter(user=counterpart).first()
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id), "active": conversation.active, "counterpart": DatingProfileSerializer(profile).data if profile else None})


class MessageInputSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=4000, trim_whitespace=True)


class ConversationMessagesView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingMessageThrottle]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(
            id=conversation_id,
            active=True,
            match__active=True,
            match__user_a__status=NexoraUser.Status.ACTIVE,
            match__user_b__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        if DatingBlock.objects.filter(
            Q(blocker_id=request.user.id, blocked_id=counterpart_id) | Q(blocker_id=counterpart_id, blocked_id=request.user.id)
        ).exists():
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
    permission_classes = [DatingActiveUserPermission]

    def post(self, request, conversation_id):
        try:
            updated = DatingConversationService.mark_read(actor=request.user, conversation_id=conversation_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "read", "updated": updated})


class ConversationBlockView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        if conversation.match.user_a.status != NexoraUser.Status.ACTIVE or conversation.match.user_b.status != NexoraUser.Status.ACTIVE:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        target_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        try:
            DatingSafetyService.block(actor=request.user, target=NexoraUser.objects.get(id=target_id, status=NexoraUser.Status.ACTIVE))
        except (ValueError, NexoraUser.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "blocked"})


class ConversationReportView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True, match__active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        if conversation.match.user_a.status != NexoraUser.Status.ACTIVE or conversation.match.user_b.status != NexoraUser.Status.ACTIVE:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        target_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        report_serializer = ReportInputSerializer(data={
            "target_user_id": target_id,
            "reason": request.data.get("reason", "other"),
            "details": request.data.get("details", ""),
        })
        report_serializer.is_valid(raise_exception=True)
        try:
            report = DatingSafetyService.report(
                actor=request.user,
                target=NexoraUser.objects.get(id=target_id, status=NexoraUser.Status.ACTIVE),
                reason=report_serializer.validated_data["reason"],
                details=report_serializer.validated_data.get("details", ""),
            )
        except (ValueError, NexoraUser.DoesNotExist) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class NotificationView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        items = DatingNotification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
        unread = DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).count()
        return Response({"items": [{"id": str(n.id), "type": n.type, "title": n.title, "body": n.body, "data": n.data, "createdAt": n.created_at.isoformat(), "readAt": n.read_at.isoformat() if n.read_at else None} for n in items], "unreadCount": unread})

    def post(self, request):
        updated = DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"status": "read", "updated": updated})


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatingNotificationPreference
        fields = ("push_enabled", "match_push_enabled", "message_push_enabled", "safety_push_enabled")


class NotificationPreferencesView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        preference, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(preference).data)

    def patch(self, request):
        preference, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(NotificationPreferenceSerializer(serializer.save()).data)


class PushTokenView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingPushThrottle]

    def post(self, request):
        token = str(request.data.get("token", "")).strip()
        platform = str(request.data.get("platform", "")).strip().casefold()
        if not token or not platform:
            return Response({"detail": "token and platform are required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(token) > 512:
            return Response({"detail": "token is too long."}, status=status.HTTP_400_BAD_REQUEST)
        if platform not in {"ios", "android", "web"}:
            return Response({"detail": "platform must be ios, android, or web."}, status=status.HTTP_400_BAD_REQUEST)
        push_token, _ = DatingPushToken.objects.update_or_create(
            token=token,
            defaults={"user": request.user, "platform": platform, "active": True},
        )
        return Response({"id": str(push_token.id), "status": "registered"}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        token = str(request.data.get("token", "")).strip()
        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)
        DatingPushToken.objects.filter(user=request.user, token=token).update(active=False)
        return Response({"status": "unregistered"})


class ConversationPresenceView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(
            id=conversation_id,
            active=True,
            match__active=True,
            match__user_a__status=NexoraUser.Status.ACTIVE,
            match__user_b__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        if DatingBlock.objects.filter(
            Q(blocker_id=request.user.id, blocked_id=counterpart_id) | Q(blocker_id=counterpart_id, blocked_id=request.user.id)
        ).exists():
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        presence, _ = DatingConversationPresence.objects.get_or_create(user=request.user)
        presence.conversation = conversation
        presence.active = True
        presence.last_seen_at = timezone.now()
        presence.save(update_fields=["conversation", "active", "last_seen_at", "updated_at"])
        return Response({"status": "active"})

    def delete(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(
            id=conversation_id,
            active=True,
            match__active=True,
            match__user_a__status=NexoraUser.Status.ACTIVE,
            match__user_b__status=NexoraUser.Status.ACTIVE,
        ).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if conversation.match.user_a_id == request.user.id else conversation.match.user_a_id
        if DatingBlock.objects.filter(
            Q(blocker_id=request.user.id, blocked_id=counterpart_id) | Q(blocker_id=counterpart_id, blocked_id=request.user.id)
        ).exists():
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        DatingConversationPresence.objects.filter(
            user=request.user,
            conversation_id=conversation_id,
        ).update(active=False, last_seen_at=timezone.now(), updated_at=timezone.now())
        return Response({"status": "inactive"})
