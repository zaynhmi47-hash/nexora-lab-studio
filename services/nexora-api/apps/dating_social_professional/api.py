from datetime import date

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import AuthenticatedNexoraUserPermission

from .models import DatingProfile, DatingSwipe
from .services import DatingSwipeService, discovery_for


class DiscoverySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    display_name = serializers.CharField()
    age = serializers.SerializerMethodField()
    bio = serializers.CharField()
    photo_url = serializers.URLField(allow_null=True, allow_blank=True)

    def get_age(self, obj):
        if not obj.birth_date:
            return None
        today = date.today()
        return today.year - obj.birth_date.year - (
            (today.month, today.day) < (obj.birth_date.month, obj.birth_date.day)
        )


class DiscoveryView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def get(self, request):
        items = discovery_for(request.user)
        return Response({"items": DiscoverySerializer(items, many=True).data, "next_cursor": None})


class SwipeInputSerializer(serializers.Serializer):
    target_profile_id = serializers.UUIDField()
    action = serializers.ChoiceField(choices=DatingSwipe.Action.values)


class SwipeView(APIView):
    permission_classes = [AuthenticatedNexoraUserPermission]

    def post(self, request):
        serializer = SwipeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = DatingProfile.objects.get(
                id=serializer.validated_data["target_profile_id"],
                discovery_enabled=True,
            )
            swipe, match = DatingSwipeService.record(
                actor=request.user,
                target_profile=target,
                action=serializer.validated_data["action"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except DatingProfile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "status": "accepted",
                "swipe_id": str(swipe.id),
                "matched": match is not None,
                "match_id": str(match.id) if match else None,
            },
            status=status.HTTP_201_CREATED,
        )
