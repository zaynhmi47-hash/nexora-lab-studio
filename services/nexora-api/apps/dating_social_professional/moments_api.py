from datetime import date

from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingMoment, DatingProfile
from .api import DatingActiveUserPermission, DatingActionThrottle


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

    @staticmethod
    def serialize(moment, *, own=False):
        profile = getattr(moment.author, "dating_profile", None)
        return {
            "id": str(moment.id),
            "author": {
                "id": str(moment.author_id),
                "display_name": profile.display_name if profile else moment.author.display_name,
                "photo_url": profile.photo_url if profile else "",
            },
            "caption": moment.caption,
            "media_url": moment.media_url,
            "visibility": moment.visibility if own else "public",
            "created_at": moment.created_at.isoformat(),
            "is_own": own,
        }

    def get(self, request):
        try:
            limit = min(30, max(1, int(request.query_params.get("limit", "20"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        blocked_ids = DatingBlock.objects.filter(
            Q(blocker=request.user) | Q(blocked=request.user)
        ).values_list("blocker_id", flat=True)
        blocked_targets = DatingBlock.objects.filter(
            Q(blocker=request.user) | Q(blocked=request.user)
        ).values_list("blocked_id", flat=True)
        queryset = DatingMoment.objects.select_related("author").filter(
            visibility=DatingMoment.Visibility.PUBLIC,
            author__status=NexoraUser.Status.ACTIVE,
            author__dating_profile__discovery_enabled=True,
        ).exclude(author_id__in=blocked_ids).exclude(author_id__in=blocked_targets)
        # The caller's private moments are visible only to their owner.
        own_private = DatingMoment.objects.filter(
            author=request.user, visibility=DatingMoment.Visibility.PRIVATE
        ).select_related("author")
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
        moment = DatingMoment.objects.create(author=request.user, **serializer.validated_data)
        return Response(self.serialize(moment, own=True), status=status.HTTP_201_CREATED)

    def delete(self, request):
        moment_id = request.query_params.get("moment_id")
        if not moment_id:
            return Response({"detail": "moment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        moment = DatingMoment.objects.filter(id=moment_id, author=request.user).first()
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        moment.delete()
        return Response({"status": "deleted"})
