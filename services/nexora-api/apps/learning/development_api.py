from datetime import date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (\n    LearningDevelopmentPlan, LearningMastery, LearningMasteryAssessmentEvent,\n    LearningOutcome, LearningOutcomeLessonMapping, LearningLessonCompletion,\n)


def plan_payload(plan):
    return {
        "id": str(plan.id),
        "outcomeKey": plan.outcome.key,
        "outcomeTitle": plan.outcome.title,
        "competencyTitle": plan.outcome.competency.title,
        "targetLevel": plan.target_level,
        "currentAssessedLevel": _current_level(plan.user_id, plan.outcome_id),
        "gap": max(0, plan.target_level - (_current_level(plan.user_id, plan.outcome_id) or 0)),
        "actions": plan.actions,
        "reflection": plan.reflection,
        "status": plan.status,
        "targetDate": plan.target_date.isoformat() if plan.target_date else None,
        "createdAt": plan.created_at.isoformat(),
        "updatedAt": plan.updated_at.isoformat(),
    }


def _current_level(user_id, outcome_id):
    mastery = LearningMastery.objects.filter(
        user_id=user_id, outcome_id=outcome_id, deleted_at__isnull=True,
        status__in=(LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED),
    ).first()
    return mastery.level if mastery else None


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
