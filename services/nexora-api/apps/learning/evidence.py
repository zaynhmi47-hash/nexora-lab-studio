from __future__ import annotations

from urllib.parse import urlsplit

from django.db import transaction
from django.utils import timezone

from .models import LearningCompetency, LearningEvidence, LearningMastery, LearningOutcome


class LearningEvidenceService:
    @staticmethod
    def competency_catalog() -> list[dict]:
        competencies = LearningCompetency.objects.filter(
            is_published=True,
            deleted_at__isnull=True,
        ).prefetch_related("outcomes").order_by("domain", "sort_order", "title")
        return [
            {
                "key": competency.key,
                "title": competency.title,
                "description": competency.description,
                "domain": competency.domain,
                "parentKey": competency.parent.key if competency.parent_id else None,
                "outcomes": [
                    {
                        "key": outcome.key,
                        "title": outcome.title,
                        "description": outcome.description,
                        "successCriteria": outcome.success_criteria,
                        "proficiencyLevel": outcome.proficiency_level,
                    }
                    for outcome in competency.outcomes.filter(
                        is_published=True,
                        deleted_at__isnull=True,
                    ).order_by("sort_order", "title")
                ],
            }
            for competency in competencies
        ]

    @staticmethod
    @transaction.atomic
    def submit_evidence(
        *,
        user,
        outcome_key: str,
        evidence_type: str,
        title: str,
        description: str = "",
        artifact_url: str = "",
    ) -> LearningEvidence:
        outcome = LearningOutcome.objects.select_for_update().filter(
            key=outcome_key,
            is_published=True,
            deleted_at__isnull=True,
            competency__is_published=True,
            competency__deleted_at__isnull=True,
        ).first()
        if outcome is None:
            raise LearningOutcome.DoesNotExist
        if evidence_type not in LearningEvidence.EvidenceType.values:
            raise ValueError("Unsupported evidence type.")
        if not title.strip():
            raise ValueError("Evidence title is required.")
        if artifact_url:
            parsed = urlsplit(artifact_url)
            if parsed.scheme != "https" or not parsed.netloc:
                raise ValueError("Evidence artifact URL must use HTTPS.")
        return LearningEvidence.objects.create(
            user=user,
            outcome=outcome,
            evidence_type=evidence_type,
            title=title.strip(),
            description=description.strip(),
            artifact_url=artifact_url.strip(),
            source_type=LearningEvidence.SourceType.SELF_REPORTED,
            status=LearningEvidence.Status.PENDING,
        )

    @staticmethod
    def portfolio(user) -> list[dict]:
        evidence_items = LearningEvidence.objects.filter(
            user=user,
            deleted_at__isnull=True,
            outcome__deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__is_published=True,
        ).select_related("outcome", "outcome__competency").order_by("-created_at")
        return [
            {
                "id": str(item.id),
                "outcomeKey": item.outcome.key,
                "outcomeTitle": item.outcome.title,
                "competencyKey": item.outcome.competency.key,
                "competencyTitle": item.outcome.competency.title,
                "type": item.evidence_type,
                "title": item.title,
                "description": item.description,
                "artifactUrl": item.artifact_url or None,
                "sourceType": item.source_type,
                "sourceReference": item.source_reference,
                "status": item.status,
                "submittedAt": item.created_at.isoformat(),
                "verifiedAt": item.verified_at.isoformat() if item.verified_at else None,
                "reviewNote": item.review_note,
            }
            for item in evidence_items
        ]

    @staticmethod
    def skill_profile(user) -> list[dict]:
        outcomes = LearningOutcome.objects.filter(
            is_published=True,
            deleted_at__isnull=True,
            competency__is_published=True,
            competency__deleted_at__isnull=True,
        ).select_related("competency").order_by(
            "competency__domain",
            "competency__sort_order",
            "sort_order",
            "title",
        )
        mastery_by_outcome = {
            item.outcome_id: item
            for item in LearningMastery.objects.filter(
                user=user,
                deleted_at__isnull=True,
                outcome__is_published=True,
                outcome__competency__is_published=True,
            )
        }
        evidence_counts = {}
        rows = LearningEvidence.objects.filter(
            user=user,
            deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__is_published=True,
        ).values_list("outcome_id", "status")
        for outcome_id, status in rows:
            counts = evidence_counts.setdefault(outcome_id, {"pending": 0, "verified": 0, "rejected": 0})
            counts[status] = counts.get(status, 0) + 1

        profile = []
        for outcome in outcomes:
            mastery = mastery_by_outcome.get(outcome.id)
            counts = evidence_counts.get(outcome.id, {})
            profile.append({
                "outcomeKey": outcome.key,
                "outcomeTitle": outcome.title,
                "competencyKey": outcome.competency.key,
                "competencyTitle": outcome.competency.title,
                "domain": outcome.competency.domain,
                "targetProficiencyLevel": outcome.proficiency_level,
                "masteryLevel": mastery.level if mastery else None,
                "masteryStatus": mastery.status if mastery else LearningMastery.Status.UNASSESSED,
                "assessmentMethod": mastery.assessment_method if mastery else None,
                "assessedAt": mastery.assessed_at.isoformat() if mastery and mastery.assessed_at else None,
                "evidenceCounts": {
                    "pending": counts.get("pending", 0),
                    "verified": counts.get("verified", 0),
                    "rejected": counts.get("rejected", 0),
                },
            })
        return profile
