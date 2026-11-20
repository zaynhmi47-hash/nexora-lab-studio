from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication

from .evidence_review import LearningEvidenceReviewService
from .models import LearningEvidence, LearningEvidenceShare


class LearningEvidenceShareView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not isinstance(request.data, dict):
            return Response({"detail": "Request body must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        evidence_id = request.data.get("evidenceId")
        organization_id = request.data.get("organizationId")
        if not isinstance(evidence_id, str) or not isinstance(organization_id, str):
            return Response(
                {"detail": "evidenceId and organizationId must be strings."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            share = LearningEvidenceReviewService.share_with_organization(
                user=request.user,
                evidence_id=evidence_id,
                organization_id=organization_id,
            )
        except LearningEvidence.DoesNotExist:
            return Response({"detail": "Evidence not found in your portfolio."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDeniedException:
            return Response({"detail": "Active organization membership is required."}, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {
                "evidenceId": str(share.evidence_id),
                "organizationId": str(share.organization_id),
                "sharedAt": share.created_at.isoformat(),
                "revokedAt": None,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request):
        evidence_id = request.data.get("evidenceId")
        organization_id = request.data.get("organizationId")
        if not isinstance(evidence_id, str) or not isinstance(organization_id, str):
            return Response(
                {"detail": "evidenceId and organizationId must be strings."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            LearningEvidenceReviewService.revoke_share(
                user=request.user,
                evidence_id=evidence_id,
                organization_id=organization_id,
            )
        except LearningEvidenceShare.DoesNotExist:
            return Response({"detail": "Active evidence share not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganizationEvidenceReviewQueueView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        try:
            items = LearningEvidenceReviewService.review_queue(
                reviewer=request.user,
                organization_id=organization_id,
            )
        except PermissionDeniedException:
            return Response({"detail": "Evidence review permission is required."}, status=status.HTTP_403_FORBIDDEN)
        except LearningEvidenceShare.DoesNotExist:
            return Response({"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(items)


class OrganizationEvidenceReviewView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, organization_id, evidence_id):
        if not isinstance(request.data, dict):
            return Response({"detail": "Request body must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)
        decision = request.data.get("decision")
        review_note = request.data.get("reviewNote", "")
        if not isinstance(decision, str) or not isinstance(review_note, str):
            return Response({"detail": "decision and reviewNote must be strings."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            evidence = LearningEvidenceReviewService.review_evidence(
                reviewer=request.user,
                organization_id=organization_id,
                evidence_id=evidence_id,
                decision=decision,
                review_note=review_note,
            )
        except PermissionDeniedException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except LearningEvidenceShare.DoesNotExist:
            return Response({"detail": "Shared evidence not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "evidenceId": str(evidence.id),
                "status": evidence.status,
                "reviewedAt": evidence.reviewed_at.isoformat(),
                "reviewNote": evidence.review_note,
            }
        )
