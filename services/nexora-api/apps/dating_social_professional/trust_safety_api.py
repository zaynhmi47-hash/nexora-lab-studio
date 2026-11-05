from django.db import IntegrityError, transaction
from django.db.models import Case, IntegerField, When
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import NexoraUser

from .api import DatingActiveUserPermission
from .moderation_api import DatingMomentModeratorPermission
from .models import DatingModerationAppeal, DatingMoment, DatingReport, DatingSafetyAuditEvent


class ReportReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DatingReport.Status.choices, required=False)
    priority = serializers.ChoiceField(choices=DatingReport.Priority.choices, required=False)
    resolution = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)


class TrustSafetyReportsView(APIView):
    permission_classes = [DatingActiveUserPermission, DatingMomentModeratorPermission]

    def get(self, request):
        queryset = DatingReport.objects.filter(deleted_at__isnull=True).select_related(
            "reporter", "reported", "assigned_to", "reviewed_by"
        ).order_by(Case(\n            When(priority=DatingReport.Priority.URGENT, then=0),\n            When(priority=DatingReport.Priority.HIGH, then=1),\n            When(priority=DatingReport.Priority.NORMAL, then=2),\n            When(priority=DatingReport.Priority.LOW, then=3),\n            output_field=IntegerField(),\n        ), "created_at")
        state = request.query_params.get("status")
        priority = request.query_params.get("priority")
        if state:
            if state not in DatingReport.Status.values:
                return Response({"detail": "Invalid report status."}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(status=state)
        if priority:
            if priority not in DatingReport.Priority.values:
                return Response({"detail": "Invalid report priority."}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(priority=priority)
        try:
            limit = min(100, max(1, int(request.query_params.get("limit", "30"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        items = [{
            "id": str(item.id),
            "reporter_id": str(item.reporter_id),
            "reported_user_id": str(item.reported_id),
            "reason": item.reason,
            "details": item.details,
            "status": item.status,
            "priority": item.priority,
            "assigned_to_id": str(item.assigned_to_id) if item.assigned_to_id else None,
            "resolution": item.resolution,
            "created_at": item.created_at.isoformat(),
            "reviewed_at": item.reviewed_at.isoformat() if item.reviewed_at else None,
        } for item in queryset[:limit]]
        return Response({"items": items})

    def patch(self, request, report_id):
        serializer = ReportReviewSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if not serializer.validated_data:
            return Response({"detail": "At least one review field is required."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            report = DatingReport.objects.select_for_update().filter(
                id=report_id, deleted_at__isnull=True
            ).first()
            if not report:
                return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
            previous = report.status
            data = serializer.validated_data
            for field in ("status", "priority", "resolution"):
                if field in data:
                    setattr(report, field, data[field])
            if "assigned_to_id" in data:
                assignee_id = data["assigned_to_id"]
                assignee = NexoraUser.objects.filter(
                    id=assignee_id, status=NexoraUser.Status.ACTIVE
                ).first() if assignee_id else None
                if assignee_id and not assignee:
                    return Response({"detail": "Active assignee not found."}, status=status.HTTP_400_BAD_REQUEST)
                report.assigned_to = assignee
            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.save(update_fields=[
                "status", "priority", "resolution", "assigned_to",
                "reviewed_by", "reviewed_at", "updated_at",
            ])
            DatingSafetyAuditEvent.objects.create(
                actor=request.user, report=report, action="report_updated",
                previous_state=previous, new_state=report.status,
                note=report.resolution[:1000],
                metadata={"priority": report.priority, "assigned_to_id": str(report.assigned_to_id) if report.assigned_to_id else None},
            )
        return Response({
            "id": str(report.id), "status": report.status, "priority": report.priority,
            "assigned_to_id": str(report.assigned_to_id) if report.assigned_to_id else None,
            "resolution": report.resolution,
        })


class DatingMomentAppealInputSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, trim_whitespace=True)


class DatingMomentAppealView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        appeals = DatingModerationAppeal.objects.filter(
            appellant=request.user, deleted_at__isnull=True
        ).select_related("moment").order_by("-created_at")[:50]
        return Response({"items": [{
            "id": str(item.id), "moment_id": str(item.moment_id),
            "message": item.message, "status": item.status,
            "reviewer_note": item.reviewer_note,
            "created_at": item.created_at.isoformat(),
            "reviewed_at": item.reviewed_at.isoformat() if item.reviewed_at else None,
        } for item in appeals]})

    def post(self, request, moment_id):
        serializer = DatingMomentAppealInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        moment = DatingMoment.objects.filter(
            id=moment_id, author=request.user, deleted_at__isnull=True,
            moderation_status=DatingMoment.ModerationStatus.REJECTED,
        ).first()
        if not moment:
            return Response({"detail": "Only your rejected Moments can be appealed."}, status=status.HTTP_404_NOT_FOUND)
        try:
            appeal = DatingModerationAppeal.objects.create(
                moment=moment, appellant=request.user,
                message=serializer.validated_data["message"],
            )
        except IntegrityError:
            return Response({"detail": "An appeal already exists for this Moment."}, status=status.HTTP_409_CONFLICT)
        return Response({
            "id": str(appeal.id), "moment_id": str(moment.id), "status": appeal.status,
        }, status=status.HTTP_201_CREATED)


class TrustSafetyAppealsView(APIView):
    permission_classes = [DatingActiveUserPermission, DatingMomentModeratorPermission]

    def get(self, request):
        appeals = DatingModerationAppeal.objects.filter(
            deleted_at__isnull=True
        ).select_related("moment", "appellant").order_by("created_at")[:100]
        return Response({"items": [{
            "id": str(item.id), "moment_id": str(item.moment_id),
            "appellant_id": str(item.appellant_id), "message": item.message,
            "moment_caption": item.moment.caption, "status": item.status,
            "reviewer_note": item.reviewer_note,
            "created_at": item.created_at.isoformat(),
        } for item in appeals]})

    def patch(self, request, appeal_id):
        action = request.data.get("status")
        note = str(request.data.get("reviewer_note", "")).strip()
        if action not in {DatingModerationAppeal.Status.ACCEPTED, DatingModerationAppeal.Status.REJECTED}:
            return Response({"detail": "status must be accepted or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        if not note:
            return Response({"detail": "reviewer_note is required."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            appeal = DatingModerationAppeal.objects.select_for_update().select_related("moment").filter(
                id=appeal_id, deleted_at__isnull=True
            ).first()
            if not appeal:
                return Response({"detail": "Appeal not found."}, status=status.HTTP_404_NOT_FOUND)
            if appeal.status != DatingModerationAppeal.Status.OPEN:
                return Response({"detail": "This appeal has already been reviewed."}, status=status.HTTP_409_CONFLICT)
            previous = appeal.status
            appeal.status = action
            appeal.reviewer = request.user
            appeal.reviewer_note = note[:1000]
            appeal.reviewed_at = timezone.now()
            appeal.save(update_fields=["status", "reviewer", "reviewer_note", "reviewed_at", "updated_at"])
            moment = DatingMoment.objects.select_for_update().get(pk=appeal.moment_id)
            if action == DatingModerationAppeal.Status.ACCEPTED:
                moment.moderation_status = DatingMoment.ModerationStatus.APPROVED
                moment.moderation_reason = ""
            moment.moderation_reviewed_at = timezone.now()
            moment.moderation_reviewed_by = request.user
            moment.save(update_fields=[
                "moderation_status", "moderation_reason",
                "moderation_reviewed_at", "moderation_reviewed_by", "updated_at",
            ])
            DatingSafetyAuditEvent.objects.create(
                actor=request.user, appeal=appeal, moment=moment,
                action="appeal_reviewed", previous_state=previous,
                new_state=appeal.status, note=appeal.reviewer_note,
            )
        return Response({
            "id": str(appeal.id), "status": appeal.status,
            "moment_moderation_status": moment.moderation_status,
            "reviewed_at": appeal.reviewed_at.isoformat(),
        })
