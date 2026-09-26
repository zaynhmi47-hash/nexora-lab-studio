from datetime import date

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission

from .models import DatingMatch, DatingProfile, DatingSwipe
from .services import DatingSafetyService, DatingSwipeService, discovery_for


class DatingProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = DatingProfile
        fields = ("id", "display_name", "birth_date", "age", "bio", "photo_url", "relationship_intent", "discovery_enabled")

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
