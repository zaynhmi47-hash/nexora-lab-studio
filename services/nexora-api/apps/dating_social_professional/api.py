from datetime import date

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission

from .models import DatingConversation, DatingMatch, DatingProfile, DatingSwipe
from .models.safety import DatingReport
from .conversation_service import DatingConversationService
from .services import DatingSafetyService, DatingSwipeService, discovery_for


class DatingProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = DatingProfile
        fields = ("id", "display_name", "birth_date", "age", "bio", "photo_url", "relationship_intent", "discovery_enabled", "preferred_min_age", "preferred_max_age")

    def get_age(self, obj):
        if not obj.birth_date:
            return None
        today = date.today()
        return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))


class DiscoveryView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        return Response({"items": DatingProfileSerializer(discovery_for(request.user), many=True).data, "next_cursor": None})


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
