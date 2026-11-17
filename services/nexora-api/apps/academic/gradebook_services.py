from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.academic.models import (
    AcademicAssessmentComponent, AcademicCourseCompletion, AcademicEnrollment,
    AcademicFinalGrade, AcademicGradeEntry, AcademicGradeRevision, AcademicGradingPolicy,
)


class AcademicGradebookService:
    """Transactional grade operations. API permission checks remain at the view boundary."""

    @staticmethod
    @transaction.atomic
    def configure_policy(*, organization, offering, max_score=Decimal("100"), passing_score=None):
        offering.__class__.objects.select_for_update().get(pk=offering.pk)
        if offering.organization_id != organization.pk:
            raise ValidationError({"offering": "Offering belongs to another organization."})
        current = AcademicGradingPolicy.objects.select_for_update().filter(
            organization=organization, offering=offering, is_active=True, deleted_at__isnull=True,
        ).order_by("-version").first()
        if current and current.max_score == max_score and current.passing_score == passing_score:
            return current
        next_version = (AcademicGradingPolicy.objects.filter(
            organization=organization, offering=offering, deleted_at__isnull=True,
        ).order_by("-version").values_list("version", flat=True).first() or 0) + 1
        if current:
            current.is_active = False
            current.save(update_fields=("is_active", "updated_at"))
        policy = AcademicGradingPolicy(
            organization=organization, offering=offering,
            max_score=max_score, passing_score=passing_score, version=next_version,
        )
        policy.full_clean()
        policy.save()
        return policy

    @staticmethod
    @transaction.atomic
    def create_component(*, organization, offering, name, weight_percent, max_score=Decimal("100"),
                         description="", is_required=True, position=0):
        offering.__class__.objects.select_for_update().get(pk=offering.pk)
        if offering.organization_id != organization.pk:
            raise ValidationError({"offering": "Offering belongs to another organization."})
        active_weight = AcademicAssessmentComponent.objects.filter(
            organization=organization, offering=offering, is_active=True, deleted_at__isnull=True,
        ).aggregate(total=Sum("weight_percent"))["total"] or Decimal("0")
        weight = Decimal(str(weight_percent))
        if active_weight + weight > Decimal("100"):
            raise ValidationError({"weight_percent": "Assessment weights cannot exceed 100 percent."})
        component = AcademicAssessmentComponent(
            organization=organization, offering=offering, name=name,
            weight_percent=weight, max_score=max_score, description=description,
            is_required=is_required, position=position,
        )
        component.full_clean()
        component.save()
        return component

    @staticmethod
    def _ensure_assigned_instructor(*, organization, offering, user):
        membership = offering.__class__._meta.apps.get_model("organizations", "Membership").objects.filter(
            organization=organization, user=user, status="active", deleted_at__isnull=True,
        ).first()
        if membership is None or not AcademicEnrollment.objects.filter(
            organization=organization, classroom=offering.classroom, membership=membership,
            role=AcademicEnrollment.Role.INSTRUCTOR, status=AcademicEnrollment.Status.ACTIVE,
            deleted_at__isnull=True,
        ).exists():
            raise ValidationError({"actor": "User is not an active instructor assigned to this classroom."})
        return membership

    @staticmethod
    @transaction.atomic
    def record_grade(*, organization, offering, component, membership, score, graded_by):
        offering.__class__.objects.select_for_update().get(pk=offering.pk)
        AcademicGradebookService._ensure_assigned_instructor(
            organization=organization, offering=offering, user=graded_by)
        if component.organization_id != organization.pk or component.offering_id != offering.pk:
            raise ValidationError({"component": "Assessment component does not belong to this offering."})
        if membership.organization_id != organization.pk or membership.status != "active":
            raise ValidationError({"membership": "An active membership in this organization is required."})
        enrolled = AcademicEnrollment.objects.filter(
            organization=organization, classroom=offering.classroom, membership=membership,
            role=AcademicEnrollment.Role.STUDENT, status=AcademicEnrollment.Status.ACTIVE,
            deleted_at__isnull=True,
        ).exists()
        if not enrolled:
            raise ValidationError({"membership": "Student must be actively enrolled in this classroom."})
        existing = AcademicGradeEntry.objects.filter(
            organization=organization, component=component, membership=membership, deleted_at__isnull=True,
        ).first()
        if existing and existing.status == AcademicGradeEntry.Status.PUBLISHED:
            raise ValidationError({"score": "Published component grades cannot be overwritten."})
        entry = existing or AcademicGradeEntry(
            organization=organization, offering=offering, component=component,
            membership=membership, graded_by=graded_by)
        entry.score, entry.graded_by = score, graded_by
        entry.full_clean()
        entry.save()
        return entry

    @staticmethod
    @transaction.atomic
    def publish_component_grade(*, entry, published_by):
        entry = AcademicGradeEntry.objects.select_for_update().select_related(
            "offering", "membership", "organization", "component").get(pk=entry.pk)
        AcademicGradebookService._ensure_assigned_instructor(
            organization=entry.organization, offering=entry.offering, user=published_by)
        if entry.status == AcademicGradeEntry.Status.PUBLISHED:
            return entry
        entry.status, entry.published_at = AcademicGradeEntry.Status.PUBLISHED, timezone.now()
        entry.full_clean()
        entry.save(update_fields=("status", "published_at", "updated_at"))
        return entry

    @staticmethod
    def calculate_final_score(*, organization, offering, membership):
        if membership.organization_id != organization.pk or membership.status != "active":
            raise ValidationError({"membership": "An active membership in this organization is required."})
        if not AcademicEnrollment.objects.filter(
            organization=organization, classroom=offering.classroom, membership=membership,
            role=AcademicEnrollment.Role.STUDENT, status=AcademicEnrollment.Status.ACTIVE,
            deleted_at__isnull=True,
        ).exists():
            raise ValidationError({"membership": "Student must be actively enrolled in this offering's classroom."})
        policy = AcademicGradingPolicy.objects.filter(
            organization=organization, offering=offering, is_active=True, deleted_at__isnull=True,
        ).first()
        if policy is None:
            raise ValidationError({"grading_policy": "Configure a grading policy before calculating final grades."})
        components = list(AcademicAssessmentComponent.objects.filter(
            organization=organization, offering=offering, is_active=True, deleted_at__isnull=True))
        if not components:
            raise ValidationError({"components": "At least one active assessment component is required."})
        if sum((c.weight_percent for c in components), Decimal("0")) != Decimal("100"):
            raise ValidationError({"weight_percent": "Active assessment weights must total exactly 100 percent."})
        entries = {e.component_id: e for e in AcademicGradeEntry.objects.filter(
            organization=organization, offering=offering, membership=membership,
            status=AcademicGradeEntry.Status.PUBLISHED, deleted_at__isnull=True)}
        missing = [c.name for c in components if c.is_required and c.pk not in entries]
        if missing:
            raise ValidationError({"grades": "Required grades are not published: " + ", ".join(missing)})
        total = Decimal("0")
        for component in components:
            entry = entries.get(component.pk)
            if entry is not None:
                normalized = entry.score / component.max_score * policy.max_score
                total += normalized * component.weight_percent / Decimal("100")
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), policy

    @staticmethod
    @transaction.atomic
    def publish_final_grade(*, organization, offering, membership, published_by):
        offering.__class__.objects.select_for_update().get(pk=offering.pk)
        AcademicGradebookService._ensure_assigned_instructor(
            organization=organization, offering=offering, user=published_by)
        if membership.organization_id != organization.pk or membership.status != "active":
            raise ValidationError({"membership": "An active membership in this organization is required."})
        score, policy = AcademicGradebookService.calculate_final_score(
            organization=organization, offering=offering, membership=membership)
        outcome = (AcademicFinalGrade.Outcome.PENDING_POLICY if policy.passing_score is None
                   else AcademicFinalGrade.Outcome.PASSED if score >= policy.passing_score
                   else AcademicFinalGrade.Outcome.FAILED)
        grade = AcademicFinalGrade.objects.select_for_update().filter(
            organization=organization, offering=offering, membership=membership, deleted_at__isnull=True,
        ).first()
        if grade and grade.status == AcademicFinalGrade.Status.PUBLISHED:
            raise ValidationError({"grade": "Published final grade is immutable; use the revision workflow."})
        grade = grade or AcademicFinalGrade(
            organization=organization, offering=offering, membership=membership)
        grade.grading_policy = policy
        grade.course_code_snapshot = offering.course.code
        grade.course_name_snapshot = offering.course.name
        grade.credit_units_snapshot = (
            offering.curriculum_entry.credit_units if offering.curriculum_entry_id
            else offering.course.credit_units
        )
        grade.final_score, grade.outcome = score, outcome
        grade.status, grade.published_at, grade.published_by = (
            AcademicFinalGrade.Status.PUBLISHED, timezone.now(), published_by)
        grade.full_clean()
        grade.save()
        AcademicGradebookService._reconcile_completion(grade=grade, actor=published_by)
        return grade

    @staticmethod
    def _reconcile_completion(*, grade, actor):
        evidence_reference = f"gradebook:final-grade:{grade.pk}"
        completion = AcademicCourseCompletion.objects.filter(
            organization=grade.organization, membership=grade.membership,
            course=grade.offering.course, evidence_reference=evidence_reference, deleted_at__isnull=True,
        ).first()
        if grade.outcome == AcademicFinalGrade.Outcome.PASSED:
            completion = completion or AcademicCourseCompletion(
                organization=grade.organization, membership=grade.membership,
                course=grade.offering.course, evidence_reference=evidence_reference)
            completion.status = AcademicCourseCompletion.Status.VERIFIED
            completion.completed_at = completion.completed_at or grade.published_at
            completion.verified_at, completion.verified_by = grade.published_at, actor
            completion.full_clean()
            completion.save()
        elif completion and completion.status == AcademicCourseCompletion.Status.VERIFIED:
            completion.status = AcademicCourseCompletion.Status.REJECTED
            completion.verified_at, completion.verified_by = None, None
            completion.full_clean()
            completion.save()

    @staticmethod
    @transaction.atomic
    def revise_final_grade(*, grade, new_score, changed_by, reason):
        grade = AcademicFinalGrade.objects.select_for_update().select_related(
            "organization", "offering", "membership", "grading_policy").get(pk=grade.pk)
        AcademicGradebookService._ensure_assigned_instructor(
            organization=grade.organization, offering=grade.offering, user=changed_by)
        if grade.status != AcademicFinalGrade.Status.PUBLISHED:
            raise ValidationError({"grade": "Only published final grades can be revised."})
        if not reason or not reason.strip():
            raise ValidationError({"reason": "A revision reason is required."})
        # Revisions deliberately retain the policy version used at original publication.
        policy = grade.grading_policy
        if policy is None:
            raise ValidationError({"grading_policy": "This historical grade has no policy provenance; it must be reviewed before revision."})
        score = Decimal(str(new_score))
        if score < 0 or score > policy.max_score:
            raise ValidationError({"new_score": "Score is outside the original grading policy range."})
        revision_number = (grade.revisions.order_by("-revision_number").values_list(
            "revision_number", flat=True).first() or 0) + 1
        revision = AcademicGradeRevision(
            organization=grade.organization, final_grade=grade, revision_number=revision_number,
            previous_score=grade.final_score, new_score=score, reason=reason.strip(), changed_by=changed_by)
        revision.full_clean()
        revision.save()
        grade.final_score = score
        grade.outcome = (AcademicFinalGrade.Outcome.PENDING_POLICY if policy.passing_score is None
            else AcademicFinalGrade.Outcome.PASSED if score >= policy.passing_score
            else AcademicFinalGrade.Outcome.FAILED)
        grade.published_by, grade.published_at = changed_by, timezone.now()
        grade.full_clean()
        grade.save()
        AcademicGradebookService._reconcile_completion(grade=grade, actor=changed_by)
        return grade
