from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (
    GrowthDevelopmentReview,
    GrowthEvidenceEvent,
    GrowthMilestone,
    GrowthMilestoneEvidence,
)
from .services import GrowthDevelopmentReviewService, GrowthMilestoneService


class GrowthMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthMilestone
        fields = (
            "id", "title", "description", "pillar", "status", "success_criteria",
            "target_date", "achieved_at", "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "achieved_at", "created_at", "updated_at")

    def validate_success_criteria(self, value):
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            raise serializers.ValidationError("success_criteria must be a list of non-empty strings.")
        return value


class GrowthMilestoneUpdateSerializer(GrowthMilestoneSerializer):
    status = serializers.ChoiceField(choices=GrowthMilestone.Status.choices, required=False)

    class Meta(GrowthMilestoneSerializer.Meta):
        read_only_fields = ("id", "achieved_at", "created_at", "updated_at")


class GrowthMilestoneEvidenceInputSerializer(serializers.Serializer):
    evidence_event_id = serializers.UUIDField()


class GrowthDevelopmentReviewInputSerializer(serializers.Serializer):
    period = serializers.ChoiceField(choices=GrowthDevelopmentReview.Period.choices)
    reflection = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    next_steps = serializers.ListField(
        child=serializers.CharField(max_length=500, allow_blank=False),
        required=False,
        max_length=20,
    )


class GrowthMilestoneListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        milestones = GrowthMilestone.objects.filter(user=request.user, deleted_at__isnull=True).prefetch_related("evidence_links")
        data = GrowthMilestoneSerializer(milestones, many=True).data
        for item, milestone in zip(data, milestones):
            item["evidenceCount"] = len(milestone.evidence_links.all())
        return Response(data)

    def post(self, request):
        serializer = GrowthMilestoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            milestone = GrowthMilestoneService.create_milestone(
                user=request.user, **serializer.validated_data,
            )
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthMilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)


class GrowthMilestoneDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, milestone_id):
        serializer = GrowthMilestoneUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            milestone = GrowthMilestoneService.update_milestone(
                user=request.user, milestone_id=milestone_id, **serializer.validated_data,
            )
        except GrowthMilestone.DoesNotExist:
            return Response({"detail": "Milestone not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthMilestoneSerializer(milestone).data)


class GrowthMilestoneEvidenceView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, milestone_id):
        serializer = GrowthMilestoneEvidenceInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = GrowthMilestoneService.link_evidence(
                user=request.user,
                milestone_id=milestone_id,
                evidence_event_id=serializer.validated_data["evidence_event_id"],
            )
        except GrowthMilestone.DoesNotExist:
            return Response({"detail": "Milestone not found."}, status=status.HTTP_404_NOT_FOUND)
        except GrowthEvidenceEvent.DoesNotExist:
            return Response({"detail": "Evidence event not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "id": link.pk,
                "milestoneId": str(link.milestone_id),
                "evidenceEventId": str(link.evidence_event_id),
                "createdAt": link.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class GrowthDevelopmentReviewView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = GrowthDevelopmentReview.objects.filter(user=request.user)
        data = [
            {
                "id": str(item.id),
                "period": item.period,
                "periodStart": item.period_start.isoformat(),
                "periodEnd": item.period_end.isoformat(),
                "evidenceCount": item.evidence_count,
                "achievedMilestoneCount": item.achieved_milestone_count,
                "activeMilestoneCount": item.active_milestone_count,
                "pillarActivity": item.pillar_activity,
                "reflection": item.reflection,
                "nextSteps": item.next_steps,
                "generatedAt": item.generated_at.isoformat(),
            }
            for item in reviews
        ]
        return Response(data)

    def post(self, request):
        serializer = GrowthDevelopmentReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            review, created = GrowthDevelopmentReviewService.create_review(
                user=request.user, **serializer.validated_data,
            )
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "id": str(review.id),
                "period": review.period,
                "periodStart": review.period_start.isoformat(),
                "periodEnd": review.period_end.isoformat(),
                "evidenceCount": review.evidence_count,
                "achievedMilestoneCount": review.achieved_milestone_count,
                "activeMilestoneCount": review.active_milestone_count,
                "pillarActivity": review.pillar_activity,
                "reflection": review.reflection,
                "nextSteps": review.next_steps,
                "generatedAt": review.generated_at.isoformat(),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
