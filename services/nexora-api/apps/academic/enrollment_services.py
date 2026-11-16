from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework.exceptions import NotFound, ValidationError

from apps.academic.models import AcademicClassroom, AcademicEnrollment, AcademicTerm
from apps.control_plane.audit import record_control_plane_audit
from apps.organizations.models import Membership, Organization


class AcademicEnrollmentService:
    @staticmethod
    def _validate(instance):
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise ValidationError(exc.message_dict) from exc
            raise ValidationError({"detail": exc.messages}) from exc

    @staticmethod
    def _audit(*, actor, organization, action, enrollment):
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=actor,
            metadata={
                "organization_id": str(organization.id),
                "action": action,
                "resource": "enrollments",
                "resource_id": str(enrollment.id),
                "classroom_id": str(enrollment.classroom_id),
                "membership_id": str(enrollment.membership_id),
                "role": enrollment.role,
                "status": enrollment.status,
            },
        )

    @staticmethod
    @transaction.atomic
    def create(*, actor, organization: Organization, classroom_id, membership_id, role):
        classroom = (
            AcademicClassroom.objects.active()
            .select_for_update()
            .select_related("term")
            .filter(id=classroom_id, organization=organization)
            .first()
        )
        if classroom is None:
            raise NotFound("Academic classroom not found.")
        if classroom.status != AcademicClassroom.Status.OPEN:
            raise ValidationError({"classroom": "Enrollments are only allowed while a classroom is open."})
        if classroom.term.status != AcademicTerm.Status.ACTIVE:
            raise ValidationError({"term": "Enrollments require an active academic term."})

        membership = (
            Membership.objects.active()
            .select_for_update()
            .filter(id=membership_id, organization=organization, status=Membership.Status.ACTIVE)
            .first()
        )
        if membership is None:
            raise ValidationError({"membership_id": "An active membership in this organization is required."})

        if role == AcademicEnrollment.Role.STUDENT and classroom.capacity is not None:
            occupied = AcademicEnrollment.objects.active().filter(
                classroom=classroom,
                role=AcademicEnrollment.Role.STUDENT,
                status=AcademicEnrollment.Status.ACTIVE,
            ).count()
            if occupied >= classroom.capacity:
                raise ValidationError({"classroom": "The classroom has reached its student capacity."})

        enrollment = AcademicEnrollment(
            organization=organization,
            classroom=classroom,
            term=classroom.term,
            membership=membership,
            role=role,
        )
        AcademicEnrollmentService._validate(enrollment)
        try:
            enrollment.save()
        except IntegrityError as exc:
            raise ValidationError({"membership_id": "This member already has an active enrollment for this classroom and role."}) from exc
        AcademicEnrollmentService._audit(
            actor=actor, organization=organization, action="enrolled", enrollment=enrollment,
        )
        return enrollment

    @staticmethod
    def get_enrollment(*, organization, enrollment_id, lock=False):
        queryset = AcademicEnrollment.objects.active().filter(organization=organization)
        if lock:
            queryset = queryset.select_for_update()
        enrollment = queryset.select_related("classroom", "term", "membership").filter(id=enrollment_id).first()
        if enrollment is None:
            raise NotFound("Academic enrollment not found.")
        return enrollment

    @staticmethod
    @transaction.atomic
    def change_status(*, actor, organization, enrollment_id, status):
        enrollment = AcademicEnrollmentService.get_enrollment(
            organization=organization, enrollment_id=enrollment_id, lock=True,
        )
        allowed = {
            AcademicEnrollment.Status.ACTIVE: {
                AcademicEnrollment.Status.ACTIVE,
                AcademicEnrollment.Status.WITHDRAWN,
                AcademicEnrollment.Status.COMPLETED,
            },
            AcademicEnrollment.Status.WITHDRAWN: {AcademicEnrollment.Status.WITHDRAWN},
            AcademicEnrollment.Status.COMPLETED: {AcademicEnrollment.Status.COMPLETED},
        }
        if status not in allowed[enrollment.status]:
            raise ValidationError({"status": "An inactive enrollment cannot be reactivated; create a new enrollment instead."})
        enrollment.status = status
        AcademicEnrollmentService._validate(enrollment)
        enrollment.save(update_fields=("status", "updated_at"))
        AcademicEnrollmentService._audit(
            actor=actor, organization=organization, action="status_changed", enrollment=enrollment,
        )
        return enrollment
