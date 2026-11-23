from __future__ import annotations

from urllib.parse import urlsplit

from django.db import transaction

from .models import LearningCompetency, LearningEvidence, LearningMastery, LearningOutcome


class LearningEvidenceService:
    @staticmethod
    def development_journey(*, user, window_days=30, limit=100, offset=0):
        """Build an owner-only, source-attributed development activity stream."""
        from datetime import timedelta

        from django.utils import timezone

        from apps.academic.models import AcademicCourseCompletion
        from apps.career.models import CareerExperience, CareerProject
        from apps.growth.models import (
            GrowthEvidenceEvent,
            GrowthGoal,
            GrowthHabit,
            GrowthHabitCheckIn,
            GrowthMilestone,
            GrowthMilestoneEvidence,
        )

        if window_days not in (7, 30, 90):
            raise ValueError("window_days must be 7, 30 or 90.")
        if type(limit) is not int or not 1 <= limit <= 100:
            raise ValueError("limit must be an integer between 1 and 100.")
        if type(offset) is not int or offset < 0:
            raise ValueError("offset must be a non-negative integer.")

        now = timezone.now()
        start_at = now - timedelta(days=window_days)
        items = []

        evidence_items = LearningEvidence.objects.filter(
            user=user,
            created_at__gte=start_at,
            deleted_at__isnull=True,
            outcome__deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__deleted_at__isnull=True,
            outcome__competency__is_published=True,
        ).select_related("outcome", "outcome__competency").order_by("-created_at")
        for evidence in evidence_items:
            items.append({
                "id": f"learning-evidence:{evidence.id}",
                "occurredAt": evidence.created_at.isoformat(),
                "domain": evidence.source_type,
                "kind": "evidence",
                "title": evidence.title,
                "description": evidence.outcome.title,
                "source": {
                    "type": evidence.source_type,
                    "reference": evidence.source_reference or None,
                    "evidenceType": evidence.evidence_type,
                },
                "competency": {
                    "key": evidence.outcome.competency.key,
                    "title": evidence.outcome.competency.title,
                    "outcomeKey": evidence.outcome.key,
                    "outcomeTitle": evidence.outcome.title,
                },
                "status": evidence.status,
                "mastery": None,
                "relatedMilestones": [],
            })

        academic_completions = AcademicCourseCompletion.objects.filter(
            membership__user=user,
            membership__deleted_at__isnull=True,
            course__deleted_at__isnull=True,
            organization__deleted_at__isnull=True,
            status=AcademicCourseCompletion.Status.VERIFIED,
            verified_at__gte=start_at,
            verified_at__lte=now,
            verified_at__isnull=False,
            deleted_at__isnull=True,
        ).select_related("course", "verified_by").prefetch_related(
            "course__outcome_mappings__outcome__competency",
        ).order_by("-verified_at", "-id")
        for completion in academic_completions:
            mappings = [
                mapping for mapping in completion.course.outcome_mappings.all()
                if mapping.is_active
                and mapping.deleted_at is None
                and mapping.outcome.is_published
                and mapping.outcome.deleted_at is None
                and mapping.outcome.competency.is_published
                and mapping.outcome.competency.deleted_at is None
            ]
            evidence_rows = mappings or [None]
            for mapping in evidence_rows:
                competency = None
                if mapping is not None:
                    competency = {
                        "key": mapping.outcome.competency.key,
                        "title": mapping.outcome.competency.title,
                        "outcomeKey": mapping.outcome.key,
                        "outcomeTitle": mapping.outcome.title,
                    }
                items.append({
                    "id": (
                        f"academic-completion:{completion.id}:"
                        f"{mapping.id if mapping is not None else 'unmapped'}"
                    ),
                    "occurredAt": completion.verified_at.isoformat(),
                    "domain": "academic",
                    "kind": "verified_course_completion",
                    "title": "Formal course completion verified",
                    "description": completion.course.name,
                    "source": {
                        "type": "academic_course_completion",
                        "reference": completion.evidence_reference or str(completion.id),
                        "organizationId": str(completion.organization_id),
                        "verifierAttributed": completion.verified_by_id is not None,
                        "contributionType": mapping.contribution_type if mapping is not None else None,
                    },
                    "competency": competency,
                    "status": "verified",
                    "mastery": None,
                    "relatedMilestones": [],
                })

        career_experiences = CareerExperience.objects.filter(
            user=user, deleted_at__isnull=True,
            created_at__gte=start_at, created_at__lte=now,
        ).order_by("-start_date", "-created_at")
        for experience in career_experiences:
            items.append({
                "id": f"career-experience:{experience.id}",
                "occurredAt": experience.created_at.isoformat(),
                "domain": "career",
                "kind": "professional_experience",
                "title": experience.role_title,
                "description": experience.organization_name,
                "source": {
                    "type": "self_reported_career_record",
                    "employmentType": experience.employment_type,
                    "startDate": experience.start_date.isoformat(),
                    "endDate": experience.end_date.isoformat() if experience.end_date else None,
                    "isCurrent": experience.is_current,
                },
                "competency": None,
                "status": "self_reported",
                "mastery": None,
                "relatedMilestones": [],
            })

        career_projects = CareerProject.objects.filter(
            user=user, deleted_at__isnull=True,
            created_at__gte=start_at, created_at__lte=now,
        ).order_by("-updated_at", "-created_at")
        for project in career_projects:
            items.append({
                "id": f"career-project:{project.id}",
                "occurredAt": project.created_at.isoformat(),
                "domain": "career",
                "kind": "portfolio_project",
                "title": project.title,
                "description": project.summary,
                "source": {
                    "type": "self_reported_portfolio",
                    "role": project.role,
                    "skills": project.skills,
                    "artifactUrl": project.artifact_url or None,
                    "visibility": project.visibility,
                    "projectStatus": project.status,
                },
                "competency": None,
                "status": "self_reported",
                "mastery": None,
                "relatedMilestones": [],
            })

        from apps.research.models import (
            ResearchEvidenceVerification,
            ResearchOutput,
            ResearchOutputOutcomeMapping,
            ResearchProject,
        )

        research_projects = ResearchProject.objects.filter(
            owner=user, deleted_at__isnull=True,
            created_at__gte=start_at, created_at__lte=now,
        ).order_by("-created_at")
        for project in research_projects:
            items.append({
                "id": f"research-project:{project.id}",
                "occurredAt": project.created_at.isoformat(),
                "domain": "research",
                "kind": "research_project",
                "title": project.title,
                "description": "Research project record",
                "source": {
                    "type": "self_reported_research_project",
                    "fieldOfStudy": project.field_of_study,
                    "methodology": project.methodology,
                    "projectStatus": project.status,
                    "visibility": project.visibility,
                },
                "competency": None,
                "status": "self_reported",
                "mastery": None,
                "relatedMilestones": [],
            })

        research_outputs = ResearchOutput.objects.filter(
            project__owner=user, project__deleted_at__isnull=True,
            project__owner__deleted_at__isnull=True, deleted_at__isnull=True,
            created_at__gte=start_at, created_at__lte=now,
        ).select_related("project").order_by("-created_at")
        for output in research_outputs:
            items.append({
                "id": f"research-output:{output.id}",
                "occurredAt": output.created_at.isoformat(),
                "domain": "research",
                "kind": "research_output",
                "title": output.title,
                "description": output.get_output_type_display(),
                "source": {
                    "type": "self_reported_research_output",
                    "outputType": output.output_type,
                    "publicationStatus": output.status,
                    "provenanceStatus": output.provenance_status,
                    "hasDoi": bool(output.doi),
                    "hasResourceUrl": bool(output.resource_url),
                },
                "competency": None,
                "status": output.provenance_status,
                "mastery": None,
                "relatedMilestones": [],
            })
            verified_mappings = ResearchOutputOutcomeMapping.objects.filter(
                output=output,
                created_by=user,
                deleted_at__isnull=True,
                outcome__deleted_at__isnull=True,
                outcome__is_published=True,
                outcome__competency__deleted_at__isnull=True,
                outcome__competency__is_published=True,
            ).select_related("outcome", "outcome__competency")
            # A mapping is evidence only while an explicit organization verification
            # remains active. Emit one attributed event per verified organization;
            # never let a revoked case shadow or impersonate another review.
            verifications = output.verification_cases.filter(
                status=ResearchEvidenceVerification.Status.VERIFIED,
                deleted_at__isnull=True,
                organization__status="active",
                organization__deleted_at__isnull=True,
            ).select_related("organization", "reviewer").order_by(
                "-reviewed_at", "-created_at", "id",
            )
            for mapping in verified_mappings:
                for verification in verifications:
                    items.append({
                        "id": (
                            f"research-verified-evidence:{output.id}:"
                            f"{mapping.id}:{verification.id}"
                        ),
                        "occurredAt": (verification.reviewed_at or verification.updated_at).isoformat(),
                        "domain": "research",
                        "kind": "verified_research_competency_evidence",
                        "title": output.title,
                        "description": mapping.outcome.title,
                        "source": {
                            "type": "organization_verified_research_output",
                            "reference": str(output.id),
                            "verificationId": str(verification.id),
                            "outputType": output.output_type,
                            "verificationStatus": verification.status,
                            "organizationId": str(verification.organization_id),
                            "organizationName": verification.organization.name,
                            "reviewerAttributed": verification.reviewer_id is not None,
                        },
                        "competency": {
                            "key": mapping.outcome.competency.key,
                            "title": mapping.outcome.competency.title,
                            "outcomeKey": mapping.outcome.key,
                            "outcomeTitle": mapping.outcome.title,
                        },
                        "status": "verified_evidence",
                        "mastery": None,
                        "relatedMilestones": [],
                    })

        mastery_items = LearningMastery.objects.filter(
            user=user,
            assessed_at__gte=start_at,
            assessed_at__isnull=False,
            deleted_at__isnull=True,
            outcome__deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__deleted_at__isnull=True,
            outcome__competency__is_published=True,
        ).select_related("outcome", "outcome__competency").order_by("-assessed_at")
        for mastery in mastery_items:
            items.append({
                "id": f"mastery:{mastery.id}",
                "occurredAt": mastery.assessed_at.isoformat(),
                "domain": "assessment",
                "kind": "mastery_assessment",
                "title": "Competency assessment recorded",
                "description": mastery.outcome.title,
                "source": {
                    "type": "organization_assessment",
                    "assessmentMethod": mastery.assessment_method,
                    "assessorAttributed": mastery.assessed_by_id is not None,
                },
                "competency": {
                    "key": mastery.outcome.competency.key,
                    "title": mastery.outcome.competency.title,
                    "outcomeKey": mastery.outcome.key,
                    "outcomeTitle": mastery.outcome.title,
                },
                "status": mastery.status,
                "mastery": {"level": mastery.level, "status": mastery.status},
                "relatedMilestones": [],
            })

        growth_events = list(GrowthEvidenceEvent.objects.filter(
            user=user,
            occurred_at__gte=start_at,
            occurred_at__lte=now,
        ).order_by("-occurred_at", "-id"))
        milestone_links = GrowthMilestoneEvidence.objects.filter(
            user=user,
            evidence_event__in=growth_events,
            milestone__deleted_at__isnull=True,
        ).select_related("milestone")
        links_by_event = {}
        for link in milestone_links:
            links_by_event.setdefault(str(link.evidence_event_id), []).append({
                "id": str(link.milestone_id),
                "title": link.milestone.title,
                "pillar": link.milestone.pillar,
                "status": link.milestone.status,
            })

        for event in growth_events:
            description = None
            if event.subject_type == "goal":
                subject = GrowthGoal.objects.filter(
                    id=event.subject_id, user=user, deleted_at__isnull=True,
                ).only("title").first()
                if subject is None:
                    continue
                description = subject.title
            elif event.subject_type == "habit":
                subject = GrowthHabit.objects.filter(
                    id=event.subject_id, user=user, deleted_at__isnull=True,
                ).only("title").first()
                if subject is None:
                    continue
                description = subject.title
            elif event.subject_type == "habit_check_in":
                subject = GrowthHabitCheckIn.objects.filter(
                    id=event.subject_id, habit__user=user,
                    habit__deleted_at__isnull=True, deleted_at__isnull=True,
                ).select_related("habit").only("habit__title").first()
                if subject is None:
                    continue
                description = subject.habit.title
            elif event.subject_type == "milestone":
                subject = GrowthMilestone.objects.filter(
                    id=event.subject_id, user=user, deleted_at__isnull=True,
                ).only("title", "pillar", "status").first()
                if subject is None:
                    continue
                description = subject.title
            else:
                continue

            title = {
                "goal.created": "Personal goal created",
                "goal.status_changed": "Personal goal updated",
                "habit.created": "Habit created",
                "habit.check_in_recorded": "Habit check-in recorded",
                "habit.check_in_changed": "Habit check-in updated",
                "milestone.created": "Development milestone created",
                "milestone.status_changed": (
                    "Development milestone achieved"
                    if event.metadata.get("new_status") == "achieved"
                    else "Development milestone updated"
                ),
            }.get(event.event_type, "Personal growth activity recorded")
            items.append({
                "id": f"growth-event:{event.id}",
                "occurredAt": event.occurred_at.isoformat(),
                "domain": "growth",
                "kind": event.event_type,
                "title": title,
                "description": description,
                "source": {"type": "growth_ledger", "reference": str(event.id), "subjectType": event.subject_type},
                "competency": None,
                "status": None,
                "mastery": None,
                "relatedMilestones": links_by_event.get(str(event.id), []),
            })

        items.sort(key=lambda item: (item["occurredAt"], item["id"]), reverse=True)
        return {
            "windowDays": window_days,
            "generatedAt": now.isoformat(),
            "items": items[offset:offset + limit],
            "total": len(items),
            "offset": offset,
            "limit": limit,
            "hasMore": offset + limit < len(items),
            "nextOffset": offset + limit if offset + limit < len(items) else None,
            "privacy": {
                "ownerScoped": True,
                "journalContentIncluded": False,
                "habitNotesIncluded": False,
                "privateReflectionsIncluded": False,
                "organizationAccessGranted": False,
                "careerRecordsIncluded": True,
                "careerRecordsShared": False,
                "researchRecordsIncluded": True,
                "researchRecordsShared": False,
            },
            "limitations": [
                "Activity records describe recorded evidence, not a complete measure of personal development.",
                "Learning evidence, growth activity and explicit mastery assessments remain distinct.",
                "Career experience and portfolio entries are self-reported records, not independently verified credentials.",
                "Academic and external records appear only when an authorized source has written them to the evidence registry.",
            ],
        }

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
        if evidence_type == LearningEvidence.EvidenceType.LEARNING_ACTIVITY:
            raise ValueError("Learning activity evidence is generated by Dignity Learn.")
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
            outcome__competency__deleted_at__isnull=True,
        ).select_related("outcome", "outcome__competency").prefetch_related("organization_shares__organization").order_by("-created_at")
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
                "verifiedAt": item.reviewed_at.isoformat() if item.reviewed_at else None,
                "reviewNote": item.review_note,
                "sharedOrganizations": [
                    {
                        "id": str(share.organization_id),
                        "name": share.organization.name,
                        "sharedAt": share.created_at.isoformat(),
                    }
                    for share in item.organization_shares.filter(
                        revoked_at__isnull=True,
                        deleted_at__isnull=True,
                        organization__deleted_at__isnull=True,
                    )
                ],
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
                outcome__competency__deleted_at__isnull=True,
            )
        }
        evidence_counts = {}
        rows = LearningEvidence.objects.filter(
            user=user,
            deleted_at__isnull=True,
            outcome__is_published=True,
            outcome__competency__is_published=True,
            outcome__competency__deleted_at__isnull=True,
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
