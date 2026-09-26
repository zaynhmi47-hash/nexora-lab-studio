from datetime import date

from django.utils import timezone
from django.db.models import Q

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission

from apps.identity.models import NexoraUser

from .models import DatingConversation, DatingConversationPresence, DatingMatch, DatingNotification, DatingNotificationPreference, DatingProfile, DatingProfileMedia, DatingPushToken, DatingSwipe
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
    url = serializers.URLField(max_length=2048)
    media_type = serializers.ChoiceField(choices=["image"])
    sort_order = serializers.IntegerField(min_value=0, max_value=20, required=False, default=0)
    is_primary = serializers.BooleanField(required=False, default=False)


class ProfileMediaView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, discovery_enabled=True).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if DatingBlock.objects.filter(
            Q(blocker=request.user, blocked=profile.user) | Q(blocker=profile.user, blocked=request.user)
        ).exists():
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        items = DatingProfileMedia.objects.filter(profile=profile, active=True).order_by("sort_order", "created_at")
        return Response({"items": [{"id": str(item.id), "url": item.url, "mediaType": item.media_type, "sortOrder": item.sort_order, "isPrimary": item.is_primary} for item in items]})

    def post(self, request, profile_id):
        profile = DatingProfile.objects.filter(id=profile_id, user=request.user).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProfileMediaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if DatingProfileMedia.objects.filter(profile=profile, active=True).count() >= 6:
            return Response({"detail": "A profile can have at most 6 media items."}, status=status.HTTP_400_BAD_REQUEST)
        item = DatingProfileMedia.objects.create(
            profile=profile,
            url=serializer.validated_data["url"],
            media_type=serializer.validated_data["media_type"],
            sort_order=serializer.validated_data["sort_order"],
            is_primary=serializer.validated_data["is_primary"],
        )
        if item.is_primary:
            DatingProfileMedia.objects.filter(profile=profile).exclude(id=item.id).update(is_primary=False)
        return Response({"id": str(item.id), "url": item.url, "mediaType": item.media_type, "sortOrder": item.sort_order, "isPrimary": item.is_primary}, status=status.HTTP_201_CREATED)

    def delete(self, request, profile_id):
        media_id = request.query_params.get("media_id")
        item = DatingProfileMedia.objects.filter(id=media_id, profile__id=profile_id, profile__user=request.user, active=True).first()
        if not item:
            return Response({"detail": "Media not found."}, status=status.HTTP_404_NOT_FOUND)
        item.active = False
        item.save(update_fields=["active", "updated_at"])
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
        min_age = serializer.validated_data.get("preferred_min_age", profile.preferred_min_age)
        max_age = serializer.validated_data.get("preferred_max_age", profile.preferred_max_age)
        if min_age > max_age:
            raise serializers.ValidationError({"preferred_min_age": "Minimum age cannot exceed maximum age."})
        if min_age < 18 or max_age > 99:
            raise serializers.ValidationError({"preferred_min_age": "Age preferences must be between 18 and 99."})
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


class MatchLifecycleView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, match_id):
        try:
            DatingSafetyService.unmatch(actor=request.user, match_id=match_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "unmatched"})


class MatchesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        matches = DatingMatch.objects.filter(active=True).filter(user_a=request.user) | DatingMatch.objects.filter(active=True, user_b=request.user)
        matches = matches.select_related("user_a", "user_b").order_by("-matched_at")
        return Response({"items": [{"id": str(m.id), "userA": str(m.user_a_id), "userB": str(m.user_b_id), "matchedAt": m.matched_at.isoformat()} for m in matches.distinct()]})



class BlockInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()


class ReportInputSerializer(serializers.Serializer):
    target_user_id = serializers.UUIDField()
    reason = serializers.ChoiceField(choices=DatingReport.Reason.values)
    details = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class ReportView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = ReportInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from apps.identity.models import NexoraUser

        try:
            target = NexoraUser.objects.get(id=serializer.validated_data["target_user_id"])
        except NexoraUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            report = DatingSafetyService.report(
                actor=request.user,
                target=target,
                reason=serializer.validated_data["reason"],
                details=serializer.validated_data.get("details", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class BlockView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = BlockInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = DatingProfile.objects.filter(user_id=serializer.validated_data["target_user_id"]).values_list("user", flat=True).first()
        if not target:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        from apps.identity.models import NexoraUser
        target_user = NexoraUser.objects.get(id=target)
        try:
            DatingSafetyService.block(actor=request.user, target=target_user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "blocked"}, status=status.HTTP_201_CREATED)

class PushTokenView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        token = str(request.data.get("token", "")).strip()
        platform = str(request.data.get("platform", "unknown")).strip()[:32]
        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)
        push_token, _ = DatingPushToken.objects.update_or_create(
            token=token,
            defaults={"user": request.user, "platform": platform or "unknown", "active": True},
        )
        return Response({"id": str(push_token.id), "status": "registered"})

    def delete(self, request):
        token = str(request.data.get("token", "")).strip()
        if token:
            DatingPushToken.objects.filter(user=request.user, token=token).update(active=False)
        else:
            DatingPushToken.objects.filter(user=request.user).update(active=False)
        return Response({"status": "unregistered"})


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatingNotificationPreference
        fields = ("push_enabled", "match_push_enabled", "message_push_enabled", "safety_push_enabled")


class NotificationPreferencesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        preferences, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(preferences).data)

    def patch(self, request):
        preferences, _ = DatingNotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(NotificationPreferenceSerializer(serializer.save()).data)


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
        DatingConversationPresence.objects.filter(
            user=request.user,
            conversation_id=conversation_id,
        ).update(active=False, last_seen_at=timezone.now())
        return Response({"status": "inactive"})


class NotificationView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        items = DatingNotification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
        unread = DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).count()
        return Response({"items": [{"id": str(n.id), "type": n.type, "title": n.title, "body": n.body, "data": n.data, "createdAt": n.created_at.isoformat(), "readAt": n.read_at.isoformat() if n.read_at else None} for n in items], "unreadCount": unread})

    def post(self, request):
        DatingNotification.objects.filter(recipient=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"status": "read"})



class ConversationDetailView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if request.user.id == conversation.match.user_a_id else conversation.match.user_a_id
        profile = DatingProfile.objects.filter(user_id=counterpart_id).first()
        if not profile:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id), "active": conversation.active, "counterpart": DatingProfileSerializer(profile).data})


class ConversationBlockView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if request.user.id == conversation.match.user_a_id else conversation.match.user_a_id
        target = NexoraUser.objects.get(id=counterpart_id)
        DatingSafetyService.block(actor=request.user, target=target)
        return Response({"status": "blocked"})


class ConversationReportView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        counterpart_id = conversation.match.user_b_id if request.user.id == conversation.match.user_a_id else conversation.match.user_a_id
        serializer = ReportInputSerializer(data={**request.data, "target_user_id": str(counterpart_id)})
        serializer.is_valid(raise_exception=True)
        report = DatingSafetyService.report(actor=request.user, target=NexoraUser.objects.get(id=counterpart_id), reason=serializer.validated_data["reason"], details=serializer.validated_data.get("details", ""))
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)


class ConversationView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        match_id = request.data.get("match_id")
        if not match_id:
            return Response({"detail": "match_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            conversation = DatingConversationService.get_or_create_for_user(actor=request.user, match_id=match_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"id": str(conversation.id), "matchId": str(conversation.match_id)}, status=status.HTTP_201_CREATED)


class ConversationMessagesView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request, conversation_id):
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or request.user.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        messages = conversation.messages.select_related("sender").order_by("created_at")[:100]
        return Response({"items": [{"id": str(m.id), "senderId": str(m.sender_id), "body": m.body, "createdAt": m.created_at.isoformat(), "readAt": m.read_at.isoformat() if m.read_at else None} for m in messages]})

    def post(self, request, conversation_id):
        try:
            message = DatingConversationService.send(actor=request.user, conversation_id=conversation_id, body=request.data.get("body", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"id": str(message.id), "senderId": str(message.sender_id), "body": message.body, "createdAt": message.created_at.isoformat(), "readAt": None}, status=status.HTTP_201_CREATED)


class ConversationReadView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request, conversation_id):
        try:
            count = DatingConversationService.mark_read(actor=request.user, conversation_id=conversation_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "read", "updated": count})
