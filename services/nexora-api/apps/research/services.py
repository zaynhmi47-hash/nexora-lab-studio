from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.access.services.authorization import authorize
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization

from .models import (
    ResearchContribution,
    ResearchEvidenceVerification,
    ResearchEvidenceVerificationEvent,
    ResearchOutput,
    ResearchProject,
)


class ResearchService:
    @staticmethod
    def list_projects(*, user):
        return ResearchProject.objects.filter(owner=user, deleted_at__isnull=True)

    @staticmethod
    def create_project(*, user, **data):
        project = ResearchProject(owner=user, **data)
        project.full_clean()
        project.save()
        return project

    @staticmethod
    def get_project(*, user, project_id):
        return ResearchProject.objects.get(owner=user, id=project_id, deleted_at__isnull=True)

    @staticmethod
    def update_project(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        for field, value in data.items():
            setattr(project, field, value)
        project.full_clean()
        project.save(update_fields=[*data.keys(), "updated_at"])
        return project

    @staticmethod
    def delete_project(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        project.soft_delete()

    @staticmethod
    def list_outputs(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchOutput.objects.filter(project=project, deleted_at__isnull=True)

    @staticmethod
    def create_output(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        output = ResearchOutput(project=project, **data)
        output.full_clean()
        output.save()
        return output

    @staticmethod
    def list_contributions(*, user, project_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchContribution.objects.filter(project=project, deleted_at__isnull=True)

    @staticmethod
    def create_contribution(*, user, project_id, **data):
        project = ResearchService.get_project(user=user, project_id=project_id)
        contribution = ResearchContribution(project=project, **data)
        contribution.full_clean()
        contribution.save()
        return contribution

    @staticmethod
    def get_output(*, user, project_id, output_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchOutput.objects.get(project=project, id=output_id, deleted_at__isnull=True)

    @staticmethod
    def update_output(*, user, project_id, output_id, **data):
        output = ResearchService.get_output(user=user, project_id=project_id, output_id=output_id)
        evidence_fields = {"title", "output_type", "abstract", "doi", "resource_url", "published_on"}
        if evidence_fields.intersection(data) and output.verification_cases.filter(
            status__in=[
                ResearchEvidenceVerification.Status.SUBMITTED,
                ResearchEvidenceVerification.Status.UNDER_REVIEW,
                ResearchEvidenceVerification.Status.VERIFIED,
            ],
            deleted_at__isnull=True,
        ).exists():
            raise DjangoValidationError(
                "Evidence details cannot be changed while verification is pending or verified. "
                "Complete or revoke the verification first."
            )
        for field, value in data.items():
            setattr(output, field, value)
        output.full_clean()
        output.save(update_fields=[*data.keys(), "updated_at"])
        return output

    @staticmethod
    def delete_output(*, user, project_id, output_id):
        output = ResearchService.get_output(user=user, project_id=project_id, output_id=output_id)
        if output.verification_cases.filter(
            status__in=[
                ResearchEvidenceVerification.Status.SUBMITTED,
                ResearchEvidenceVerification.Status.UNDER_REVIEW,
                ResearchEvidenceVerification.Status.VERIFIED,
            ],
            deleted_at__isnull=True,
        ).exists():
            raise DjangoValidationError(
                "An output with pending or verified evidence cannot be deleted. Resolve verification first."
            )
        output.soft_delete()

    @staticmethod
    def get_contribution(*, user, project_id, contribution_id):
        project = ResearchService.get_project(user=user, project_id=project_id)
        return ResearchContribution.objects.get(project=project, id=contribution_id, deleted_at__isnull=True)

    @staticmethod
    def update_contribution(*, user, project_id, contribution_id, **data):
        contribution = ResearchService.get_contribution(
            user=user, project_id=project_id, contribution_id=contribution_id,
        )
        for field, value in data.items():
            setattr(contribution, field, value)
        contribution.full_clean()
        contribution.save(update_fields=[*data.keys(), "updated_at"])
        return contribution

    @staticmethod
    def delete_contribution(*, user, project_id, contribution_id):
        contribution = ResearchService.get_contribution(
            user=user, project_id=project_id, contribution_id=contribution_id,
        )
        contribution.soft_delete()


class ResearchEvidenceVerificationService:
    PERMISSION_CODE = "research.evidence.verify"

    @staticmethod
    def _require_active_membership(*, user, organization):
        membership = Membership.objects.active().filter(
            user=user,
            organization=organization,
            status=Membership.Status.ACTIVE,
            organization__status=Organization.Status.ACTIVE,
            organization__deleted_at__isnull=True,
        ).first()
        if membership is None or user.status != NexoraUser.Status.ACTIVE or user.deleted_at is not None:
            raise PermissionDenied("An active organization membership is required.")
        return membership

    @staticmethod
    @transaction.atomic
    def submit(*, user, output, organization_id, consent):
        if consent is not True:
            raise ValidationError({"consent": "Explicit consent is required before sharing evidence with an organization."})
        locked_output = (
            ResearchOutput.objects.select_for_update()
            .select_related("project")
            .filter(id=output.id, deleted_at__isnull=True, project__deleted_at__isnull=True)
            .first()
        )
        if locked_output is None or locked_output.project.owner_id != user.id:
            raise PermissionDenied("Only the owner of an active research output can submit it.")
        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
            deleted_at__isnull=True,
        ).first()
        if organization is None:
            raise ValidationError({"organization_id": "An active organization is required."})
        ResearchEvidenceVerificationService._require_active_membership(user=user, organization=organization)
        open_case = ResearchEvidenceVerification.objects.select_for_update().filter(
            output=locked_output,
            status__in=[
                ResearchEvidenceVerification.Status.SUBMITTED,
                ResearchEvidenceVerification.Status.UNDER_REVIEW,
            ],
            deleted_at__isnull=True,
        ).exists()
        if open_case:
            raise ValidationError({"detail": "This output already has an active verification case."})
        case = ResearchEvidenceVerification.objects.create(
            output=locked_output,
            organization=organization,
            submitted_by=user,
            consented_at=timezone.now(),
            status=ResearchEvidenceVerification.Status.SUBMITTED,
        )
        ResearchEvidenceVerificationEvent.objects.create(
            verification=case,
            actor=user,
            from_status="",
            to_status=case.status,
            reason="Evidence submitted with explicit organization-sharing consent.",
        )
        return case

    @staticmethod
    @transaction.atomic
    def transition(*, actor, output_id, verification_id, target_status, reason=""):
        case = (
            ResearchEvidenceVerification.objects.select_for_update()
            .select_related("output__project", "organization", "submitted_by", "reviewer")
            .filter(
                id=verification_id,
                output_id=output_id,
                output__deleted_at__isnull=True,
                output__project__deleted_at__isnull=True,
                deleted_at__isnull=True,
            )
            .first()
        )
        if case is None:
            raise ResearchEvidenceVerification.DoesNotExist
        current = case.status
        is_owner = actor.id == case.submitted_by_id or actor.id == case.output.project.owner_id
        if is_owner:
            if target_status != ResearchEvidenceVerification.Status.REVOKED:
                raise PermissionDenied("Research owners may withdraw consent, but cannot review their own evidence.")
            if current not in {
                ResearchEvidenceVerification.Status.SUBMITTED,
                ResearchEvidenceVerification.Status.UNDER_REVIEW,
                ResearchEvidenceVerification.Status.VERIFIED,
            }:
                raise ValidationError({"status": "Consent can only be withdrawn from an active or verified case."})
            if not reason.strip():
                raise ValidationError({"reason": "A reason is required when withdrawing consent."})
            case.status = ResearchEvidenceVerification.Status.REVOKED
            case.decision_reason = reason.strip()
            case.full_clean()
            case.save(update_fields=["status", "decision_reason", "updated_at"])
            ResearchEvidenceVerificationEvent.objects.create(
                verification=case,
                actor=actor,
                from_status=current,
                to_status=case.status,
                reason=reason.strip(),
            )
            return case

        decision = authorize(
            user=actor,
            organization=case.organization,
            permission_code=ResearchEvidenceVerificationService.PERMISSION_CODE,
        )
        if not decision.allowed:
            raise PermissionDenied("The actor lacks the research.evidence.verify permission in this organization.")

        allowed = {
            ResearchEvidenceVerification.Status.SUBMITTED: {ResearchEvidenceVerification.Status.UNDER_REVIEW},
            ResearchEvidenceVerification.Status.UNDER_REVIEW: {
                ResearchEvidenceVerification.Status.VERIFIED,
                ResearchEvidenceVerification.Status.REJECTED,
            },
            ResearchEvidenceVerification.Status.VERIFIED: {ResearchEvidenceVerification.Status.REVOKED},
            ResearchEvidenceVerification.Status.REJECTED: set(),
            ResearchEvidenceVerification.Status.REVOKED: set(),
        }
        if target_status not in allowed[current]:
            raise ValidationError({"status": f"Transition from {current} to {target_status} is not allowed."})
        if target_status in {ResearchEvidenceVerification.Status.REJECTED, ResearchEvidenceVerification.Status.REVOKED} and not reason.strip():
            raise ValidationError({"reason": "A reason is required for rejection or revocation."})
        if current == ResearchEvidenceVerification.Status.SUBMITTED:
            case.reviewer = actor
        elif case.reviewer_id != actor.id:
            raise PermissionDenied("Only the assigned reviewer can complete this verification.")
        case.status = target_status
        case.decision_reason = reason.strip()
        if target_status in {
            ResearchEvidenceVerification.Status.VERIFIED,
            ResearchEvidenceVerification.Status.REJECTED,
            ResearchEvidenceVerification.Status.REVOKED,
        }:
            case.reviewed_at = timezone.now()
        case.full_clean()
        case.save(update_fields=["reviewer", "status", "decision_reason", "reviewed_at", "updated_at"])
        ResearchEvidenceVerificationEvent.objects.create(
            verification=case,
            actor=actor,
            from_status=current,
            to_status=target_status,
            reason=reason.strip(),
        )
        return case

    @staticmethod
    def list_for_owner(*, user, output):
        if output.project.owner_id != user.id:
            raise PermissionDenied("Only the output owner can view its verification history.")
        return ResearchEvidenceVerification.objects.filter(
            output=output, deleted_at__isnull=True,
        ).prefetch_related("events")

    @staticmethod
    def list_for_reviewer(*, actor, organization):
        decision = authorize(
            user=actor,
            organization=organization,
            permission_code=ResearchEvidenceVerificationService.PERMISSION_CODE,
        )
        if not decision.allowed:
            raise PermissionDenied("The actor lacks the research.evidence.verify permission in this organization.")
        return ResearchEvidenceVerification.objects.filter(
            Q(status=ResearchEvidenceVerification.Status.SUBMITTED)
            | Q(status=ResearchEvidenceVerification.Status.UNDER_REVIEW, reviewer=actor)
            | Q(status=ResearchEvidenceVerification.Status.VERIFIED, reviewer=actor),
            organization=organization,
            deleted_at__isnull=True,
            output__deleted_at__isnull=True,
            output__project__deleted_at__isnull=True,
        ).select_related("output", "output__project", "submitted_by", "reviewer").prefetch_related("events")
