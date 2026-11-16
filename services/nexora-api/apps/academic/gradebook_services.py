from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicCourseCompletion,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicFinalGrade,
    AcademicGradeEntry,
    AcademicGradingPolicy,
)
from apps.control_plane.audit import record_control_plane_audit
from apps.organizations.models import Membership


def _validate(instance):
    try:
        instance.full_clean()
    except DjangoValidationError as exc:
        if hasattr(exc, "message_dict"):
            raise ValidationError(exc.message_dict) from exc
        raise ValidationError({"detail": exc.messages}) from exc


def _audit(*, actor, organization, action, resource, resource_id, offering):
    record_control_plane_audit(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        actor=actor,
        metadata={
            "organization_id": str(organization.id),
            "action": action,
            "resource": resource,
            "resource_id": str(resource_id),
            "offering_id": str(offering.id),
        },
    )


class AcademicGradebookService:
    @staticmethod
    def _offering(*, organization, offering_id, lock=False):
        queryset = AcademicCourseOffering.objects.active().filter(
            id=offering_id, organization=organization,
        ).select_related("classroom", "course")
        if lock:
            queryset = queryset.select_for_update()
        offering = queryset.first()
        if offering is None:
            raise NotFound("Course offering not found.")
        return offering

    @staticmethod
    def _instructor_enrollment(organization, offering, actor):
        return AcademicEnrollment.objects.active().filter(
            organization=organization,
            classroom=offering.classroom,
            term=offering.classroom.term,
            membership__user=actor,
            membership__status=Membership.Status.ACTIVE,
            role=AcademicEnrollment.Role.INSTRUCTOR,
            status=AcademicEnrollment.Status.ACTIVE,
        ).exists()

    @staticmethod
    def _ensure_instructor(*, organization, offering, actor):
        if not AcademicGradebookService._instructor_enrollment(organization, offering, actor):
            raise ValidationError({"instructor": "An active instructor enrollment in this offering classroom is required."})

    @staticmethod
    def _student_enrollment(*, organization, offering, membership):
        allowed = AcademicEnrollment.objects.active().filter(
            organization=organization,
            classroom=offering.classroom,
            term=offering.classroom.term,
            membership=membership,
            role=AcademicEnrollment.Role.STUDENT,
            status=AcademicEnrollment.Status.ACTIVE,
        ).exists()
        if not allowed:
            raise ValidationError({"membership": "The student must have an active enrollment in this offering classroom."})

    @staticmethod
    @transaction.atomic
    def create_policy(*, actor, organization, offering_id, passing_score=None):
        offering = AcademicGradebookService._offering(
            organization=organization, offering_id=offering_id, lock=True,
        )
        AcademicGradebookService._ensure_instructor(organization=organization, offering=offering, actor=actor)
        policy = AcademicGradingPolicy(
            organization=organization, offering=offering, passing_score=passing_score,
        )
        _validate(policy)
        try:
            policy.save()
        except IntegrityError as exc:
            raise ValidationError({"policy": "A grading policy already exists for this offering."}) from exc
        _audit(actor=actor, organization=organization, action="created", resource="grading_policy", resource_id=policy.id, offering=offering)
        return policy

    @staticmethod
    @transaction.atomic
    def add_component(*, actor, organization, policy_id, code, name, weight_percent, max_score, sequence=1):
        policy = AcademicGradingPolicy.objects.select_for_update().filter(
            id=policy_id, organization=organization, deleted_at__isnull=True,
        ).select_related("offering", "offering__classroom").first()
        if policy is None:
            raise NotFound("Grading policy not found.")
        AcademicGradebookService._ensure_instructor(organization=organization, offering=policy.offering, actor=actor)
        if policy.status != AcademicGradingPolicy.Status.DRAFT:
            raise ValidationError({"policy": "Only draft grading policies can be changed."})
        component = AcademicAssessmentComponent(
            organization=organization, policy=policy, code=code, name=name,
            weight_percent=weight_percent, max_score=max_score, sequence=sequence,
        )
        _validate(component)
        component.save()
        _audit(actor=actor, organization=organization, action="component_created", resource="assessment_component", resource_id=component.id, offering=policy.offering)
        return component

    @staticmethod
    @transaction.atomic
    def activate_policy(*, actor, organization, policy_id):
        policy = AcademicGradingPolicy.objects.select_for_update().filter(
            id=policy_id, organization=organization, deleted_at__isnull=True,
        ).select_related("offering", "offering__classroom").first()
        if policy is None:
            raise NotFound("Grading policy not found.")
        AcademicGradebookService._ensure_instructor(organization=organization, offering=policy.offering, actor=actor)
        if policy.status != AcademicGradingPolicy.Status.DRAFT:
            raise ValidationError({"status": "Only draft grading policies can be activated."})
        components = list(policy.components.filter(deleted_at__isnull=True, is_active=True))
        if not components:
            raise ValidationError({"components": "At least one active assessment component is required."})
        total_weight = sum((item.weight_percent for item in components), Decimal("0"))
        if total_weight != Decimal("100.00"):
            raise ValidationError({"weight_percent": "Active assessment component weights must total exactly 100."})
        policy.status = AcademicGradingPolicy.Status.ACTIVE
        policy.save(update_fields=("status", "updated_at"))
        _audit(actor=actor, organization=organization, action="activated", resource="grading_policy", resource_id=policy.id, offering=policy.offering)
        return policy

    @staticmethod
    @transaction.atomic
    def record_grade(*, actor, organization, offering_id, component_id, membership_id, score, feedback=""):
        offering = AcademicGradebookService._offering(organization=organization, offering_id=offering_id, lock=True)
        AcademicGradebookService._ensure_instructor(organization=organization, offering=offering, actor=actor)
        policy = AcademicGradingPolicy.objects.select_for_update().filter(
            organization=organization, offering=offering, status=AcademicGradingPolicy.Status.ACTIVE,
            deleted_at__isnull=True,
        ).first()
        if policy is None:
            raise ValidationError({"policy": "An active grading policy is required before recording grades."})
        component = AcademicAssessmentComponent.objects.select_for_update().filter(
            id=component_id, organization=organization, policy=policy,
            is_active=True, deleted_at__isnull=True,
        ).first()
        if component is None:
            raise NotFound("Assessment component not found.")
        membership = Membership.objects.active().filter(
            id=membership_id, organization=organization, status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("Student membership not found.")
        AcademicGradebookService._student_enrollment(organization=organization, offering=offering, membership=membership)
        if Decimal(str(score)) > component.max_score:
            raise ValidationError({"score": "Score cannot exceed the component maximum."})

        previous = AcademicGradeEntry.objects.filter(
            component=component, membership=membership, deleted_at__isnull=True,
        ).order_by("-revision").first()
        if previous and previous.status == AcademicGradeEntry.Status.DRAFT:
            entry = previous
            entry.score = score
            entry.feedback = feedback
            entry.recorded_by = actor
            _validate(entry)
            entry.save(update_fields=("score", "feedback", "recorded_by", "updated_at"))
        else:
            entry = AcademicGradeEntry(
                organization=organization, offering=offering, component=component,
                membership=membership, score=score, feedback=feedback,
                revision=(previous.revision + 1) if previous else 1,
                recorded_by=actor, supersedes=previous,
            )
            _validate(entry)
            entry.save()
        _audit(actor=actor, organization=organization, action="grade_recorded", resource="grade_entry", resource_id=entry.id, offering=offering)
        return entry

    @staticmethod
    @transaction.atomic
    def publish_grade(*, actor, organization, grade_entry_id):
        entry = AcademicGradeEntry.objects.select_for_update().filter(
            id=grade_entry_id, organization=organization, deleted_at__isnull=True,
        ).select_related("offering", "offering__classroom", "component", "component__policy", "membership").first()
        if entry is None:
            raise NotFound("Grade entry not found.")
        offering = AcademicGradebookService._offering(organization=organization, offering_id=entry.offering_id, lock=True)
        AcademicGradebookService._ensure_instructor(organization=organization, offering=offering, actor=actor)
        if entry.status != AcademicGradeEntry.Status.DRAFT:
            raise ValidationError({"status": "Only draft grade entries can be published."})
        entry.status = AcademicGradeEntry.Status.PUBLISHED
        entry.published_by = actor
        entry.published_at = timezone.now()
        _validate(entry)
        entry.save(update_fields=("status", "published_by", "published_at", "updated_at"))
        _audit(actor=actor, organization=organization, action="grade_published", resource="grade_entry", resource_id=entry.id, offering=offering)

        policy = entry.component.policy
        components = list(policy.components.filter(is_active=True, deleted_at__isnull=True))
        latest_entries = []
        for component in components:
            latest = AcademicGradeEntry.objects.filter(
                organization=organization, offering=offering, component=component,
                membership=entry.membership, deleted_at__isnull=True,
            ).order_by("-revision").first()
            if latest is None or latest.status != AcademicGradeEntry.Status.PUBLISHED:
                return {"entry": entry, "final_grade": None, "status": "awaiting_components"}
            latest_entries.append((component, latest))

        weighted = sum(
            ((grade.score / component.max_score) * component.weight_percent for component, grade in latest_entries),
            Decimal("0"),
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        passed = None if policy.passing_score is None else weighted >= policy.passing_score
        previous_final = AcademicFinalGrade.objects.filter(
            organization=organization, offering=offering, membership=entry.membership,
        ).order_by("-revision").first()
        final_grade = AcademicFinalGrade(
            organization=organization, offering=offering, membership=entry.membership,
            weighted_score=weighted, is_pass=passed,
            revision=(previous_final.revision + 1) if previous_final else 1,
            published_by=actor, published_at=timezone.now(), supersedes=previous_final,
        )
        _validate(final_grade)
        final_grade.save()
        _audit(actor=actor, organization=organization, action="final_grade_published", resource="final_grade", resource_id=final_grade.id, offering=offering)

        if passed is False:
            # Revoke only completion evidence issued by this gradebook; never touch external evidence.
            stale = AcademicCourseCompletion.objects.filter(
                organization=organization, membership=entry.membership, course=offering.course,
                status=AcademicCourseCompletion.Status.VERIFIED,
                evidence_reference__startswith="academic-final-grade:", deleted_at__isnull=True,
            )
            for completion in stale:
                completion.status = AcademicCourseCompletion.Status.REJECTED
                completion.save(update_fields=("status", "updated_at"))
                _audit(actor=actor, organization=organization, action="course_completion_revoked", resource="course_completion", resource_id=completion.id, offering=offering)
        if passed is True:
            completion = AcademicCourseCompletion.objects.filter(
                organization=organization, membership=entry.membership, course=offering.course,
                status=AcademicCourseCompletion.Status.VERIFIED, deleted_at__isnull=True,
            ).first()
            if completion is None:
                completion = AcademicCourseCompletion(
                    organization=organization, membership=entry.membership, course=offering.course,
                    status=AcademicCourseCompletion.Status.VERIFIED,
                    completed_at=final_grade.published_at, verified_at=final_grade.published_at,
                    verified_by=actor, evidence_reference=f"academic-final-grade:{final_grade.id}",
                )
                _validate(completion)
                completion.save()
                _audit(actor=actor, organization=organization, action="course_completion_verified", resource="course_completion", resource_id=completion.id, offering=offering)
        return {"entry": entry, "final_grade": final_grade, "status": "published"}
