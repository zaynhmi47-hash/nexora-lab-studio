from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.access.services import authorize
from apps.core.exceptions import PermissionDeniedException
from apps.organizations.services import MembershipService

from .models import LearningEvidence, LearningEvidenceShare, LearningMastery, LearningMasteryAssessmentEvent, LearningOutcome, LearningOutcomeRubric


def validate_rubric_definition(criteria: object) -> list[dict]:
    if not isinstance(criteria, list) or not 1 <= len(criteria) <= 12:
        raise ValueError("A rubric must contain between 1 and 12 criteria.")
    validated = []
    keys = set()
    for item in criteria:
        if not isinstance(item, dict):
            raise ValueError("Each rubric criterion must be an object.")
        key, title, description = item.get("key"), item.get("title"), item.get("description")
        weight, levels = item.get("weight"), item.get("levels")
        if (
            not isinstance(key, str) or not key.strip() or len(key) > 64
            or key in keys
            or not isinstance(title, str) or not title.strip() or len(title) > 120
            or not isinstance(description, str) or not description.strip() or len(description) > 500
            or type(weight) is not int or not 1 <= weight <= 10
            or not isinstance(levels, dict) or set(levels) != {"1", "2", "3", "4", "5"}
            or any(not isinstance(value, str) or not value.strip() or len(value) > 500 for value in levels.values())
        ):
            raise ValueError("A rubric criterion has an invalid key, descriptor, weight or level scale.")
        keys.add(key)
        validated.append(item)
    return validated


def validate_rubric_scores(criteria: object, scores: object) -> dict[str, int]:
    validated = validate_rubric_definition(criteria)
    expected = {item["key"] for item in validated}
    if not isinstance(scores, dict) or set(scores) != expected:
        raise ValueError("A score for every rubric criterion is required.")
    result = {}
    for key, score in scores.items():
        if type(score) is not int or not 1 <= score <= 5:
            raise ValueError("Each criterion score must be an integer from 1 to 5.")
        result[key] = score
    return result


class LearningEvidenceReviewService:
    @staticmethod
    @transaction.atomic
    def share_with_organization(*, user, evidence_id, organization_id) -> LearningEvidenceShare:
        MembershipService.get_active_membership(user=user, organization_id=organization_id)
        evidence = LearningEvidence.objects.select_for_update().filter(
            id=evidence_id,
            user=user,
            deleted_at__isnull=True,
            outcome__deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__deleted_at__isnull=True,
            outcome__competency__is_published=True,
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
            evidence__outcome__deleted_at__isnull=True,
            evidence__outcome__is_published=True,
            evidence__outcome__competency__deleted_at__isnull=True,
            evidence__outcome__competency__is_published=True,
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
            evidence__outcome__deleted_at__isnull=True,
            evidence__outcome__is_published=True,
            evidence__outcome__competency__deleted_at__isnull=True,
            evidence__outcome__competency__is_published=True,
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
        evidence.reviewed_at = timezone.now()
        evidence.review_note = review_note.strip()
        evidence.save(update_fields=(
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "updated_at",
        ))
        return evidence


    @staticmethod
    @transaction.atomic
    def assess_mastery(
        *,
        assessor,
        organization_id,
        learner_id,
        outcome_key: str,
        level: int,
        status: str,
        assessment_method: str,
        rationale: str,
        criterion_scores: dict | None = None,
    ) -> LearningMastery:
        from apps.organizations.models import Organization

        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise LearningEvidenceShare.DoesNotExist
        authorization = authorize(
            user=assessor,
            organization=organization,
            permission_code="learning.mastery.assess",
        )
        if not authorization.allowed:
            raise PermissionDeniedException("Mastery assessment permission is required.")
        if type(level) is not int or not 1 <= level <= 5:
            raise ValueError("Mastery level must be an integer from 1 to 5.")
        if status not in (LearningMastery.Status.PROVISIONAL, LearningMastery.Status.VERIFIED):
            raise ValueError("Mastery status must be provisional or verified.")
        if not assessment_method.strip() or not rationale.strip():
            raise ValueError("Assessment method and rationale are required.")
        if len(assessment_method.strip()) > 80 or len(rationale.strip()) > 3000:
            raise ValueError("Assessment method or rationale exceeds the allowed length.")
        outcome = LearningOutcome.objects.filter(
            key=outcome_key,
            is_published=True,
            deleted_at__isnull=True,
            competency__is_published=True,
            competency__deleted_at__isnull=True,
        ).first()
        if outcome is None:
            raise LearningOutcome.DoesNotExist
        rubric = LearningOutcomeRubric.objects.filter(
            outcome=outcome, is_active=True, deleted_at__isnull=True,
        ).order_by("-version").first()
        validated_scores = validate_rubric_scores(rubric.criteria, criterion_scores) if rubric else {}
        if rubric is None and criterion_scores not in (None, {}):
            raise ValueError("No active rubric exists for this outcome.")
        if str(assessor.id) == str(learner_id):
            raise PermissionDeniedException("Assessors cannot assess their own mastery.")
        has_verified_shared_evidence = LearningEvidence.objects.filter(
            user_id=learner_id,
            outcome=outcome,
            status=LearningEvidence.Status.VERIFIED,
            reviewed_by__isnull=False,
            reviewed_at__isnull=False,
            deleted_at__isnull=True,
            organization_shares__organization=organization,
            organization_shares__revoked_at__isnull=True,
            organization_shares__deleted_at__isnull=True,
        ).exists()
        if not has_verified_shared_evidence:
            raise ValueError("At least one verified evidence item shared with this organization is required.")
        mastery = LearningMastery.objects.select_for_update().filter(
            user_id=learner_id,
            outcome=outcome,
            deleted_at__isnull=True,
        ).first()
        if mastery is None:
            mastery = LearningMastery(
                user_id=learner_id,
                outcome=outcome,
            )
        mastery.level = level
        mastery.status = status
        mastery.assessment_method = assessment_method.strip()
        mastery.rationale = rationale.strip()
        mastery.assessed_by = assessor
        mastery.assessed_at = timezone.now()
        mastery.save()
        LearningMasteryAssessmentEvent.objects.create(
            user=mastery.user,
            outcome=mastery.outcome,
            level=mastery.level,
            status=mastery.status,
            assessment_method=mastery.assessment_method,
            rationale=mastery.rationale,
            assessed_by=assessor,
            assessed_at=mastery.assessed_at,
            rubric_version=rubric.version if rubric else None,
            criterion_scores=validated_scores,
        )
        return mastery
