from datetime import date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (
    LearningDevelopmentPlan, LearningMastery, LearningMasteryAssessmentEvent,
    LearningOutcome, LearningOutcomeLessonMapping, LearningLessonCompletion,
)


def plan_payload(plan):
    assessment = _latest_assessment(plan.user_id, plan.outcome_id)
    current_level = assessment.level if assessment else None
    return {
        "id": str(plan.id),
        "outcomeKey": plan.outcome.key,
        "outcomeTitle": plan.outcome.title,
        "competencyTitle": plan.outcome.competency.title,
        "targetLevel": plan.target_level,
        "currentAssessedLevel": current_level,
        "gap": max(0, plan.target_level - (current_level or 0)),
        "gapStatus": (
            "needs_assessment" if assessment is None
            else "target_reached" if current_level >= plan.target_level
            else "development_needed"
        ),
        "assessmentStatus": assessment.status if assessment else "unassessed",
        "lastAssessedAt": assessment.assessed_at.isoformat() if assessment else None,
        "actions": plan.actions,
        "reflection": plan.reflection,
        "status": plan.status,
        "targetDate": plan.target_date.isoformat() if plan.target_date else None,
        "createdAt": plan.created_at.isoformat(),
        "updatedAt": plan.updated_at.isoformat(),
    }


def _latest_assessment(user_id, outcome_id):
    event = LearningMasteryAssessmentEvent.objects.filter(
        user_id=user_id, outcome_id=outcome_id, deleted_at__isnull=True,
        status__in=(LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED),
    ).order_by("-assessed_at", "-created_at").first()
    if event is not None:
        return event
    # Compatibility for assessments recorded before immutable history was introduced.
    return LearningMastery.objects.filter(
        user_id=user_id, outcome_id=outcome_id, deleted_at__isnull=True,
        status__in=(LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED),
    ).order_by("-assessed_at", "-updated_at").first()

class LearningDevelopmentPlanView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = LearningDevelopmentPlan.objects.filter(
            user=request.user, deleted_at__isnull=True,
            outcome__deleted_at__isnull=True, outcome__is_published=True,
            outcome__competency__is_published=True, outcome__competency__deleted_at__isnull=True,
        ).select_related("outcome", "outcome__competency")
        return Response([plan_payload(plan) for plan in plans])

    def post(self, request):
        if not isinstance(request.data, dict):
            return Response({"detail": "Request body must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        key = request.data.get("outcomeKey")
        target = request.data.get("targetLevel")
        actions = request.data.get("actions")
        target_date = request.data.get("targetDate")
        if not isinstance(key, str) or type(target) is not int or not 1 <= target <= 5:
            return Response({"detail": "outcomeKey and targetLevel (1-5) are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(actions, list) or not 1 <= len(actions) <= 8 or any(not isinstance(item, str) or not item.strip() or len(item) > 240 for item in actions):
            return Response({"detail": "Provide 1-8 concise action steps, each up to 240 characters."}, status=status.HTTP_400_BAD_REQUEST)
        parsed_date = None
        if target_date is not None:
            try:
                parsed_date = date.fromisoformat(target_date) if isinstance(target_date, str) else None
            except ValueError:
                parsed_date = None
            if parsed_date is None or parsed_date < date.today():
                return Response({"detail": "targetDate must be a valid date today or later."}, status=status.HTTP_400_BAD_REQUEST)
        outcome = LearningOutcome.objects.filter(
            key=key, is_published=True, deleted_at__isnull=True,
            competency__is_published=True, competency__deleted_at__isnull=True,
        ).first()
        if outcome is None:
            return Response({"detail": "Published learning outcome not found."}, status=status.HTTP_404_NOT_FOUND)
        plan = LearningDevelopmentPlan.objects.create(
            user=request.user, outcome=outcome, target_level=target,
            actions=[item.strip() for item in actions], target_date=parsed_date,
        )
        return Response(plan_payload(plan), status=status.HTTP_201_CREATED)

    def patch(self, request):
        if not isinstance(request.data, dict):
            return Response({"detail": "Request body must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        plan_id = request.data.get("planId")
        plan = LearningDevelopmentPlan.objects.filter(user=request.user, id=plan_id, deleted_at__isnull=True).select_related("outcome", "outcome__competency").first()
        if plan is None:
            return Response({"detail": "Development plan not found."}, status=status.HTTP_404_NOT_FOUND)
        if "status" in request.data:
            if request.data["status"] not in LearningDevelopmentPlan.Status.values:
                return Response({"detail": "Invalid plan status."}, status=status.HTTP_400_BAD_REQUEST)
            plan.status = request.data["status"]
        if "reflection" in request.data:
            if not isinstance(request.data["reflection"], str) or len(request.data["reflection"]) > 3000:
                return Response({"detail": "reflection must be text up to 3000 characters."}, status=status.HTTP_400_BAD_REQUEST)
            plan.reflection = request.data["reflection"]
        if "actions" in request.data:
            actions = request.data["actions"]
            if not isinstance(actions, list) or not 1 <= len(actions) <= 8 or any(not isinstance(item, str) or not item.strip() or len(item) > 240 for item in actions):
                return Response({"detail": "Provide 1-8 concise action steps, each up to 240 characters."}, status=status.HTTP_400_BAD_REQUEST)
            plan.actions = [item.strip() for item in actions]
        plan.save()
        return Response(plan_payload(plan))


class LearningDevelopmentRecommendationsView(APIView):
    """Returns curated, published learning resources mapped to one outcome."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        outcome_key = request.query_params.get("outcomeKey", "").strip()
        if not outcome_key:
            return Response({"detail": "outcomeKey is required."}, status=status.HTTP_400_BAD_REQUEST)
        outcome = LearningOutcome.objects.filter(
            key=outcome_key, is_published=True, deleted_at__isnull=True,
            competency__is_published=True, competency__deleted_at__isnull=True,
        ).first()
        if outcome is None:
            return Response({"detail": "Published learning outcome not found."}, status=status.HTTP_404_NOT_FOUND)

        mappings = LearningOutcomeLessonMapping.objects.filter(
            outcome=outcome, is_active=True, deleted_at__isnull=True,
            lesson__is_published=True, lesson__deleted_at__isnull=True,
            lesson__course__is_published=True, lesson__course__deleted_at__isnull=True,
            lesson__content__is_published=True, lesson__content__deleted_at__isnull=True,
        ).select_related("lesson", "lesson__course", "lesson__content").order_by(
            "lesson__course__sort_order", "lesson__sort_order",
        )
        lessons = [mapping.lesson for mapping in mappings]
        completed_ids = set(LearningLessonCompletion.objects.filter(
            user=request.user, lesson_id__in=[lesson.id for lesson in lessons],
        ).values_list("lesson_id", flat=True))
        return Response({
            "outcomeKey": outcome.key,
            "outcomeTitle": outcome.title,
            "resources": [{
                "lessonKey": lesson.key,
                "title": lesson.title,
                "description": lesson.description,
                "courseTitle": lesson.course.title,
                "kind": lesson.kind,
                "contributionType": mapping.contribution_type,
                "estimatedMinutes": lesson.content.estimated_minutes,
                "completed": lesson.id in completed_ids,
                "route": f"/quiz/{lesson.key}" if lesson.kind == "quiz" else f"/lesson/{lesson.key}",
            } for mapping, lesson in zip(mappings, lessons)],
        })


class LearningAssessmentHistoryView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = LearningMasteryAssessmentEvent.objects.filter(
            user=request.user, deleted_at__isnull=True,
            outcome__deleted_at__isnull=True,
        ).select_related("outcome", "outcome__competency", "assessed_by")[:100]
        return Response([{
            "id": str(event.id),
            "outcomeKey": event.outcome.key,
            "outcomeTitle": event.outcome.title,
            "competencyTitle": event.outcome.competency.title,
            "level": event.level,
            "status": event.status,
            "assessmentMethod": event.assessment_method,
            "rationale": event.rationale,
            "assessedBy": event.assessed_by.display_name,
            "assessedAt": event.assessed_at.isoformat(),
            "rubricVersion": event.rubric_version,
            "criterionScores": event.criterion_scores,
        } for event in events])


class LearningCompetencyGapAnalysisView(APIView):
    """Owner-only snapshot of published outcomes against explicit assessment records."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        outcomes = list(LearningOutcome.objects.filter(
            is_published=True, deleted_at__isnull=True,
            competency__is_published=True, competency__deleted_at__isnull=True,
        ).select_related("competency").order_by("competency__title", "sort_order", "title"))
        outcome_ids = [item.id for item in outcomes]
        events = LearningMasteryAssessmentEvent.objects.filter(
            user=request.user, outcome_id__in=outcome_ids, deleted_at__isnull=True,
            status__in=(LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED),
        ).select_related("assessed_by").order_by("-assessed_at", "-created_at")
        latest_events = {}
        for event in events:
            latest_events.setdefault(event.outcome_id, event)
        legacy = LearningMastery.objects.filter(
            user=request.user, outcome_id__in=outcome_ids, deleted_at__isnull=True,
            status__in=(LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED),
        ).order_by("-assessed_at", "-updated_at")
        for record in legacy:
            latest_events.setdefault(record.outcome_id, record)
        plans = LearningDevelopmentPlan.objects.filter(
            user=request.user, outcome_id__in=outcome_ids, deleted_at__isnull=True,
        ).order_by("-created_at")
        latest_plans = {}
        for plan in plans:
            latest_plans.setdefault(plan.outcome_id, plan)

        rows = []
        for outcome in outcomes:
            assessment = latest_events.get(outcome.id)
            plan = latest_plans.get(outcome.id)
            current_level = assessment.level if assessment else None
            target_level = plan.target_level if plan else None
            gap = max(0, target_level - current_level) if plan and current_level is not None else (
                target_level if plan else None
            )
            gap_status = (
                "needs_assessment" if assessment is None
                else "plan_needed" if plan is None
                else "target_reached" if gap == 0
                else "development_needed"
            )
            rows.append({
                "outcomeKey": outcome.key,
                "outcomeTitle": outcome.title,
                "competencyTitle": outcome.competency.title,
                "currentAssessedLevel": current_level,
                "assessmentStatus": assessment.status if assessment else "unassessed",
                "assessedAt": assessment.assessed_at.isoformat() if assessment and assessment.assessed_at else None,
                "targetLevel": target_level,
                "gap": gap,
                "gapStatus": gap_status,
                "planId": str(plan.id) if plan else None,
                "planStatus": plan.status if plan else None,
            })
        return Response({"count": len(rows), "results": rows})
