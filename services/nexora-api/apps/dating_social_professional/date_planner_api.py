from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .api import DatingActiveUserPermission, DatingActionThrottle
from .models import DatingBlock, DatingDatePlan, DatingMatch, DatingRelationshipMilestone
from .notifications.service import DatingNotificationService
from .date_reminders import cancel_date_plan_reminders, schedule_date_plan_reminders


def _partner_for(match, user_id):
    if match.user_a_id == user_id:
        return match.user_b_id
    if match.user_b_id == user_id:
        return match.user_a_id
    return None


def _active_match_for_user(match_id, user):
    match = DatingMatch.objects.filter(id=match_id, active=True).first()
    if not match or _partner_for(match, user.id) is None:
        return None
    partner_id = _partner_for(match, user.id)
    if DatingBlock.objects.filter(
        Q(blocker_id=user.id, blocked_id=partner_id)
        | Q(blocker_id=partner_id, blocked_id=user.id)
    ).exists():
        return None
    return match


class DatePlanInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatingDatePlan
        fields = ("match", "activity", "title", "starts_at", "timezone_name", "location_name", "notes")

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_location_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Location is required.")
        return value

    def validate_timezone_name(self, value):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Provide a valid IANA timezone, for example Asia/Jakarta.")
        return value

    def validate(self, attrs):
        match = attrs.get("match")
        request = self.context["request"]
        if not match or _active_match_for_user(match.id, request.user) is None:
            raise serializers.ValidationError({"match": "An active mutual match is required."})
        if attrs["starts_at"] <= timezone.now():
            raise serializers.ValidationError({"starts_at": "A date plan must be scheduled in the future."})
        return attrs


def _serialize_plan(plan, viewer_id):
    partner_id = _partner_for(plan.match, viewer_id)
    return {
        "id": str(plan.id),
        "match_id": str(plan.match_id),
        "organizer_id": str(plan.organizer_id),
        "can_respond": plan.organizer_id != viewer_id,
        "partner_id": str(partner_id),
        "activity": plan.activity,
        "title": plan.title,
        "starts_at": plan.starts_at.isoformat(),
        "timezone": plan.timezone_name,
        "location_name": plan.location_name,
        "notes": plan.notes,
        "status": plan.status,
        "responded_at": plan.responded_at.isoformat() if plan.responded_at else None,
        "cancelled_by": str(plan.cancelled_by_id) if plan.cancelled_by_id else None,
        "cancelled_at": plan.cancelled_at.isoformat() if plan.cancelled_at else None,
        "completed_at": plan.completed_at.isoformat() if plan.completed_at else None,
        "reschedule": ({"proposed_by": str(plan.reschedule_proposed_by_id), "starts_at": plan.proposed_starts_at.isoformat(), "timezone": plan.proposed_timezone_name, "location_name": plan.proposed_location_name, "notes": plan.proposed_notes, "can_respond": plan.reschedule_proposed_by_id != viewer_id} if plan.reschedule_proposed_by_id and plan.proposed_starts_at else None),
        "created_at": plan.created_at.isoformat(),
    }


class DatingDatePlansView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def get(self, request):
        plans = DatingDatePlan.objects.filter(
            Q(match__user_a=request.user) | Q(match__user_b=request.user),
            match__active=True,
        ).select_related("match").order_by("starts_at")
        items = []
        for plan in plans:
            if _active_match_for_user(plan.match_id, request.user) is not None:
                items.append(_serialize_plan(plan, request.user.id))
        return Response({"items": items})

    def post(self, request):
        serializer = DatePlanInputSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        match = serializer.validated_data["match"]
        partner_id = _partner_for(match, request.user.id)
        with transaction.atomic():
            plan = DatingDatePlan.objects.create(
                organizer=request.user,
                status=DatingDatePlan.Status.PROPOSED,
                **serializer.validated_data,
            )
            DatingNotificationService.create_and_dispatch(
                recipient_id=partner_id,
                notification_type="social",
                title="New date invitation",
                body="Your match proposed a date. Review the plan in Nexora.",
                data={"date_plan_id": str(plan.id), "match_id": str(match.id), "event": "date_plan_invitation"},
            )
        return Response(_serialize_plan(plan, request.user.id), status=status.HTTP_201_CREATED)


class DatingDatePlanResponseView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request, plan_id):
        decision = request.data.get("decision")
        if decision not in {"accept", "decline"}:
            return Response({"detail": "decision must be accept or decline."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            plan = DatingDatePlan.objects.select_for_update().select_related("match").filter(id=plan_id).first()
            if not plan or _active_match_for_user(plan.match_id, request.user) is None:
                return Response({"detail": "Date plan not found."}, status=status.HTTP_404_NOT_FOUND)
            if plan.organizer_id == request.user.id:
                return Response({"detail": "The organizer cannot respond to their own invitation."}, status=status.HTTP_403_FORBIDDEN)
            if plan.status != DatingDatePlan.Status.PROPOSED:
                return Response({"detail": "This invitation is no longer awaiting a response."}, status=status.HTTP_409_CONFLICT)
            plan.status = DatingDatePlan.Status.ACCEPTED if decision == "accept" else DatingDatePlan.Status.DECLINED
            plan.responded_at = timezone.now()
            plan.save(update_fields=("status", "responded_at", "updated_at"))
            if decision == "accept":
                schedule_date_plan_reminders(plan)
            DatingNotificationService.create_and_dispatch(
                recipient_id=plan.organizer_id,
                notification_type="social",
                title="Date invitation response",
                body="Your date invitation was " + ("accepted." if decision == "accept" else "declined."),
                data={"date_plan_id": str(plan.id), "match_id": str(plan.match_id), "event": "date_plan_response"},
            )
        return Response(_serialize_plan(plan, request.user.id))


class DatingRelationshipMilestonesView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def get(self, request, match_id):
        match = _active_match_for_user(match_id, request.user)
        if not match:
            return Response({"detail": "Active match not found."}, status=status.HTTP_404_NOT_FOUND)
        milestones = DatingRelationshipMilestone.objects.filter(match=match)
        by_stage = {item.stage: item for item in milestones}
        items = []
        for stage, label in DatingRelationshipMilestone.Stage.choices:
            item = by_stage.get(stage)
            a_at = item.acknowledged_by_a_at if item else None
            b_at = item.acknowledged_by_b_at if item else None
            items.append({
                "stage": stage,
                "label": label,
                "acknowledged_by_me": bool((a_at if match.user_a_id == request.user.id else b_at)),
                "acknowledged_by_partner": bool((b_at if match.user_a_id == request.user.id else a_at)),
                "mutually_acknowledged": bool(a_at and b_at),
            })
        return Response({"match_id": str(match.id), "items": items})

    def post(self, request, match_id):
        stage = request.data.get("stage")
        valid_stages = {value for value, _ in DatingRelationshipMilestone.Stage.choices}
        if stage not in valid_stages:
            return Response({"detail": "A valid relationship milestone stage is required."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            match = DatingMatch.objects.select_for_update().filter(id=match_id, active=True).first()
            if not match or _active_match_for_user(match_id, request.user) is None:
                return Response({"detail": "Active match not found."}, status=status.HTTP_404_NOT_FOUND)
            milestone, _ = DatingRelationshipMilestone.objects.get_or_create(match=match, stage=stage)
            now = timezone.now()
            field = "acknowledged_by_a_at" if match.user_a_id == request.user.id else "acknowledged_by_b_at"
            if getattr(milestone, field) is None:
                setattr(milestone, field, now)
                milestone.save(update_fields=(field, "updated_at"))
            partner_id = _partner_for(match, request.user.id)
            other_field = "acknowledged_by_b_at" if field == "acknowledged_by_a_at" else "acknowledged_by_a_at"
            if getattr(milestone, other_field) is None:
                DatingNotificationService.create_and_dispatch(
                    recipient_id=partner_id,
                    notification_type="social",
                    title="Relationship journey update",
                    body="Your match acknowledged a relationship milestone.",
                    data={"match_id": str(match.id), "stage": stage, "event": "relationship_milestone"},
                )
        return self.get(request, match_id)


class DatingDatePlanLifecycleView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request, plan_id):
        action = request.data.get("action")
        if action not in {"cancel", "complete"}:
            return Response({"detail": "action must be cancel or complete."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            plan = DatingDatePlan.objects.select_for_update().select_related("match").filter(id=plan_id).first()
            if not plan or _active_match_for_user(plan.match_id, request.user) is None:
                return Response({"detail": "Date plan not found."}, status=status.HTTP_404_NOT_FOUND)
            recipient_id = _partner_for(plan.match, request.user.id)
            if action == "cancel":
                if plan.status not in {DatingDatePlan.Status.PROPOSED, DatingDatePlan.Status.ACCEPTED}:
                    return Response({"detail": "This plan cannot be cancelled in its current state."}, status=status.HTTP_409_CONFLICT)
                plan.status = DatingDatePlan.Status.CANCELLED
                plan.cancelled_by = request.user
                plan.cancelled_at = timezone.now()
                plan.reschedule_proposed_by = None
                plan.proposed_starts_at = None
                plan.proposed_timezone_name = ""
                plan.proposed_location_name = ""
                plan.proposed_notes = ""
                plan.reschedule_proposed_at = None
                plan.save(update_fields=("status", "cancelled_by", "cancelled_at", "reschedule_proposed_by", "proposed_starts_at", "proposed_timezone_name", "proposed_location_name", "proposed_notes", "reschedule_proposed_at", "updated_at"))
                cancel_date_plan_reminders(plan)
                title, body, event = "Date cancelled", "Your match cancelled the planned date.", "date_plan_cancelled"
            else:
                if plan.status != DatingDatePlan.Status.ACCEPTED or plan.starts_at > timezone.now():
                    return Response({"detail": "Only an accepted date in the past can be marked completed."}, status=status.HTTP_409_CONFLICT)
                plan.status = DatingDatePlan.Status.COMPLETED
                plan.completed_at = timezone.now()
                plan.save(update_fields=("status", "completed_at", "updated_at"))
                title, body, event = "Date marked completed", "Your match marked the planned date completed.", "date_plan_completed"
            DatingNotificationService.create_and_dispatch(recipient_id=recipient_id, notification_type="social", title=title, body=body, data={"date_plan_id": str(plan.id), "event": event})
        return Response(_serialize_plan(plan, request.user.id))


class DatingDatePlanRescheduleView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request, plan_id):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        starts_at = request.data.get("starts_at")
        timezone_name = request.data.get("timezone_name")
        location_name = str(request.data.get("location_name", "")).strip()
        notes = str(request.data.get("notes", ""))
        try:
            ZoneInfo(timezone_name)
            parsed_starts_at = serializers.DateTimeField().to_internal_value(starts_at)
        except (ZoneInfoNotFoundError, ValueError, TypeError, serializers.ValidationError):
            return Response({"detail": "Provide a future starts_at and valid IANA timezone_name."}, status=status.HTTP_400_BAD_REQUEST)
        if parsed_starts_at <= timezone.now() or not location_name:
            return Response({"detail": "A future date and location are required."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            plan = DatingDatePlan.objects.select_for_update().select_related("match").filter(id=plan_id).first()
            if not plan or _active_match_for_user(plan.match_id, request.user) is None:
                return Response({"detail": "Date plan not found."}, status=status.HTTP_404_NOT_FOUND)
            if plan.status != DatingDatePlan.Status.ACCEPTED or plan.reschedule_proposed_by_id:
                return Response({"detail": "Only an accepted date without a pending proposal can be rescheduled."}, status=status.HTTP_409_CONFLICT)
            plan.reschedule_proposed_by = request.user
            plan.proposed_starts_at = parsed_starts_at
            plan.proposed_timezone_name = timezone_name
            plan.proposed_location_name = location_name[:180]
            plan.proposed_notes = notes[:1000]
            plan.reschedule_proposed_at = timezone.now()
            plan.save(update_fields=("reschedule_proposed_by", "proposed_starts_at", "proposed_timezone_name", "proposed_location_name", "proposed_notes", "reschedule_proposed_at", "updated_at"))
            DatingNotificationService.create_and_dispatch(recipient_id=_partner_for(plan.match, request.user.id), notification_type="social", title="Reschedule proposal", body="Your match proposed a change to your accepted date.", data={"date_plan_id": str(plan.id), "event": "date_plan_reschedule"})
        return Response(_serialize_plan(plan, request.user.id))

    def put(self, request, plan_id):
        decision = request.data.get("decision")
        if decision not in {"accept", "decline"}:
            return Response({"detail": "decision must be accept or decline."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            plan = DatingDatePlan.objects.select_for_update().select_related("match").filter(id=plan_id).first()
            if not plan or _active_match_for_user(plan.match_id, request.user) is None:
                return Response({"detail": "Date plan not found."}, status=status.HTTP_404_NOT_FOUND)
            if not plan.reschedule_proposed_by_id or plan.reschedule_proposed_by_id == request.user.id:
                return Response({"detail": "No proposal from your match is awaiting your response."}, status=status.HTTP_409_CONFLICT)
            if plan.status != DatingDatePlan.Status.ACCEPTED:
                return Response({"detail": "This date can no longer be rescheduled."}, status=status.HTTP_409_CONFLICT)
            proposer_id = plan.reschedule_proposed_by_id
            if decision == "accept":
                plan.starts_at = plan.proposed_starts_at
                plan.timezone_name = plan.proposed_timezone_name
                plan.location_name = plan.proposed_location_name
                plan.notes = plan.proposed_notes
            plan.reschedule_proposed_by = None
            plan.proposed_starts_at = None
            plan.proposed_timezone_name = ""
            plan.proposed_location_name = ""
            plan.proposed_notes = ""
            plan.reschedule_proposed_at = None
            plan.save(update_fields=("starts_at", "timezone_name", "location_name", "notes", "reschedule_proposed_by", "proposed_starts_at", "proposed_timezone_name", "proposed_location_name", "proposed_notes", "reschedule_proposed_at", "updated_at"))
            if decision == "accept":
                schedule_date_plan_reminders(plan)
            DatingNotificationService.create_and_dispatch(recipient_id=proposer_id, notification_type="social", title="Reschedule response", body="Your reschedule proposal was " + ("accepted." if decision == "accept" else "declined."), data={"date_plan_id": str(plan.id), "event": "date_plan_reschedule_response", "decision": decision})
        return Response(_serialize_plan(plan, request.user.id))
