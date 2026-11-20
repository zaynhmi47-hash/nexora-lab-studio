from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .evidence import LearningEvidenceService
from .models import LearningOutcome


class LearningCompetencyCatalogView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(LearningEvidenceService.competency_catalog())


class LearningEvidencePortfolioView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(LearningEvidenceService.portfolio(request.user))

    def post(self, request):
        if not isinstance(request.data, dict):
            return Response(
                {"detail": "Request body must be a JSON object."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        outcome_key = request.data.get("outcomeKey")
        evidence_type = request.data.get("type")
        title = request.data.get("title")
        description = request.data.get("description", "")
        artifact_url = request.data.get("artifactUrl", "")
        if not isinstance(outcome_key, str) or not isinstance(evidence_type, str) or not isinstance(title, str):
            return Response(
                {"detail": "outcomeKey, type, and title must be strings."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(description, str) or not isinstance(artifact_url, str):
            return Response(
                {"detail": "description and artifactUrl must be strings."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            evidence = LearningEvidenceService.submit_evidence(
                user=request.user,
                outcome_key=outcome_key,
                evidence_type=evidence_type,
                title=title,
                description=description,
                artifact_url=artifact_url,
            )
        except LearningOutcome.DoesNotExist:
            return Response({"detail": "Published learning outcome not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "id": str(evidence.id),
                "outcomeKey": evidence.outcome.key,
                "type": evidence.evidence_type,
                "title": evidence.title,
                "description": evidence.description,
                "artifactUrl": evidence.artifact_url or None,
                "sourceType": evidence.source_type,
                "status": evidence.status,
                "submittedAt": evidence.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class LearningSkillProfileView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(LearningEvidenceService.skill_profile(request.user))
