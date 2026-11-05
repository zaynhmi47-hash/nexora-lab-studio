from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DatingMoment
from .moments_api import DatingMomentView


class DatingMomentModerationInputSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        DatingMoment.ModerationStatus.APPROVED,
        DatingMoment.ModerationStatus.REJECTED,
    ])
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)


class DatingMomentModerationQueueView(APIView):
    """Staff-only human review queue. No automated moderation provider is implied."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            limit = min(100, max(1, int(request.query_params.get("limit", "30"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = DatingMoment.objects.filter(
            deleted_at__isnull=True,
            moderation_status=DatingMoment.ModerationStatus.PENDING,
        ).select_related("author", "author__dating_profile").order_by("created_at")[:limit]
        items = []
        for moment in queryset:
            item = DatingMomentView.serialize(moment, own=True)
            item["author"]["id"] = str(moment.author_id)
            item["moderation_status"] = moment.moderation_status
            items.append(item)
        return Response({"items": items})

    def patch(self, request, moment_id):
        moment = DatingMoment.objects.filter(
            id=moment_id, deleted_at__isnull=True,
        ).select_related("author", "author__dating_profile").first()
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DatingMomentModerationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        moment.moderation_status = serializer.validated_data["status"]
        moment.moderation_reason = serializer.validated_data.get("reason", "").strip()
        moment.moderation_reviewed_at = timezone.now()
        moment.moderation_reviewed_by = request.user
        moment.save(update_fields=[
            "moderation_status", "moderation_reason",
            "moderation_reviewed_at", "moderation_reviewed_by", "updated_at",
        ])
        return Response({
            "id": str(moment.id),
            "moderation_status": moment.moderation_status,
            "moderation_reason": moment.moderation_reason,
            "reviewed_at": moment.moderation_reviewed_at.isoformat(),
        })
