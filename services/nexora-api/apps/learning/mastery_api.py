from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication

from .evidence_review import LearningEvidenceReviewService
from .models import LearningEvidenceShare, LearningOutcome, LearningOutcomeRubric


class OrganizationMasteryAssessmentView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, organization_id):
        if not isinstance(request.data, dict):
            return Response({"detail": "Request body must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        learner_id = request.data.get("learnerId")
        outcome_key = request.data.get("outcomeKey")
        level = request.data.get("level")
        mastery_status = request.data.get("status")
        assessment_method = request.data.get("assessmentMethod")
        rationale = request.data.get("rationale")
        criterion_scores = request.data.get("criterionScores", {})
        if (
            not isinstance(learner_id, str)
            or not isinstance(outcome_key, str)
            or type(level) is not int
            or not isinstance(mastery_status, str)
            or not isinstance(assessment_method, str)
            or not isinstance(rationale, str)
            or not isinstance(criterion_scores, dict)
        ):
            return Response(
                {"detail": "learnerId, outcomeKey, level, status, assessmentMethod and rationale are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            mastery = LearningEvidenceReviewService.assess_mastery(
                assessor=request.user,
                organization_id=organization_id,
                learner_id=learner_id,
                outcome_key=outcome_key,
                level=level,
                status=mastery_status,
                assessment_method=assessment_method,
                rationale=rationale,
                criterion_scores=criterion_scores,
            )
        except PermissionDeniedException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except (LearningEvidenceShare.DoesNotExist, LearningOutcome.DoesNotExist):
            return Response({"detail": "Organization or published learning outcome not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "learnerId": str(mastery.user_id),
                "outcomeKey": mastery.outcome.key,
                "level": mastery.level,
                "status": mastery.status,
                "assessmentMethod": mastery.assessment_method,
                "rationale": mastery.rationale,
                "assessedBy": str(mastery.assessed_by_id),
                "assessedAt": mastery.assessed_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )



class LearningOutcomeRubricView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        outcome_key = request.query_params.get("outcomeKey", "")
        if not outcome_key:
            return Response({"detail": "outcomeKey is required."}, status=status.HTTP_400_BAD_REQUEST)
        rubric = LearningOutcomeRubric.objects.filter(
            outcome__key=outcome_key,
            outcome__is_published=True,
            outcome__deleted_at__isnull=True,
            outcome__competency__is_published=True,
            outcome__competency__deleted_at__isnull=True,
            is_active=True,
            deleted_at__isnull=True,
        ).select_related("outcome", "outcome__competency").order_by("-version").first()
        if rubric is None:
            return Response({"detail": "No active assessment rubric is available."}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "outcomeKey": rubric.outcome.key,
            "outcomeTitle": rubric.outcome.title,
            "competencyTitle": rubric.outcome.competency.title,
            "version": rubric.version,
            "criteria": rubric.criteria,
            "levelScale": [
                {"level": 1, "label": "Beginning"},
                {"level": 2, "label": "Developing"},
                {"level": 3, "label": "Capable"},
                {"level": 4, "label": "Proficient"},
                {"level": 5, "label": "Advanced"},
            ],
        })
