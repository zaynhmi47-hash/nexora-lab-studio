from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.access.services import authorize
from apps.core.exceptions import PermissionDeniedException
from apps.organizations.services import MembershipService

from .models import LearningEvidence, LearningEvidenceShare


class LearningEvidenceReviewService:
    @staticmethod
    @transaction.atomic
    def share_with_organization(*, user, evidence_id, organization_id) -> LearningEvidenceShare:
        MembershipService.get_active_membership(user=user, organization_id=organization_id)
        evidence = LearningEvidence.objects.select_for_update().filter(
            id=evidence_id,
            user=user,
            deleted_at__isnull=True,
        ).first()
        if evidence is None:
            raise LearningEvidence.DoesNotExist
        share = LearningEvidenceShare.objects.filter(
            evidence=evidence,
            organization_id=organization_id,
            revoked_at__isnull=True,
            deleted_at__isnull=True,
        ).first()
        if share is not None:
            return share
        return LearningEvidenceShare.objects.create(
            evidence=evidence,
            organization_id=organization_id,
            shared_by=user,
        )

    @staticmethod
    @transaction.atomic
    def revoke_share(*, user, evidence_id, organization_id) -> None:
        share = LearningEvidenceShare.objects.select_for_update().filter(
            evidence_id=evidence_id,
            evidence__user=user,
            evidence__deleted_at__isnull=True,
            organization_id=organization_id,
            revoked_at__isnull=True,
            deleted_at__isnull=True,
        ).first()
        if share is None:
            raise LearningEvidenceShare.DoesNotExist
        share.revoked_at = timezone.now()
        share.save(update_fields=("revoked_at", "updated_at"))

    @staticmethod
    def review_queue(*, reviewer, organization_id) -> list[dict]:
        from apps.organizations.models import Organization

        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise LearningEvidenceShare.DoesNotExist
        decision = authorize(
            user=reviewer,
            organization=organization,
            permission_code="learning.evidence.review",
        )
        if not decision.allowed:
            raise PermissionDeniedException("Evidence review permission is required.")
        shares = LearningEvidenceShare.objects.filter(
            organization=organization,
            revoked_at__isnull=True,
            deleted_at__isnull=True,
            evidence__deleted_at__isnull=True,
            evidence__status=LearningEvidence.Status.PENDING,
        ).select_related("evidence", "evidence__user", "evidence__outcome")
        return [
            {
                "evidenceId": str(share.evidence_id),
                "learnerId": str(share.evidence.user_id),
                "learnerDisplayName": share.evidence.user.display_name,
                "outcomeKey": share.evidence.outcome.key,
                "outcomeTitle": share.evidence.outcome.title,
                "type": share.evidence.evidence_type,
                "title": share.evidence.title,
                "description": share.evidence.description,
                "artifactUrl": share.evidence.artifact_url or None,
                "submittedAt": share.evidence.created_at.isoformat(),
                "sharedAt": share.created_at.isoformat(),
            }
            for share in shares.order_by("created_at")
        ]

    @staticmethod
    @transaction.atomic
    def review_evidence(
        *,
        reviewer,
        organization_id,
        evidence_id,
        decision: str,
        review_note: str = "",
    ) -> LearningEvidence:
        from apps.organizations.models import Organization

        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise LearningEvidenceShare.DoesNotExist
        authorization = authorize(
            user=reviewer,
            organization=organization,
            permission_code="learning.evidence.review",
        )
        if not authorization.allowed:
            raise PermissionDeniedException("Evidence review permission is required.")
        if decision not in (LearningEvidence.Status.VERIFIED, LearningEvidence.Status.REJECTED):
            raise ValueError("Review decision must be verified or rejected.")
        share = LearningEvidenceShare.objects.select_for_update().filter(
            organization=organization,
            evidence_id=evidence_id,
            revoked_at__isnull=True,
            deleted_at__isnull=True,
            evidence__deleted_at__isnull=True,
        ).select_related("evidence").first()
        if share is None:
            raise LearningEvidenceShare.DoesNotExist
        evidence = share.evidence
        if evidence.user_id == reviewer.id:
            raise PermissionDeniedException("Learners cannot review their own evidence.")
        if evidence.status != LearningEvidence.Status.PENDING:
            raise ValueError("Only pending evidence can be reviewed.")
        evidence.status = decision
        evidence.reviewed_by = reviewer
        evidence.verified_at = timezone.now()
        evidence.review_note = review_note.strip()
        evidence.save(update_fields=(
            "status",
            "reviewed_by",
            "verified_at",
            "review_note",
            "updated_at",
        ))
        return evidence
