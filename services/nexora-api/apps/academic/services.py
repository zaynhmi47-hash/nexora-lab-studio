from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.academic.models import AcademicClassroom, AcademicProgram, AcademicTerm
from apps.control_plane.audit import record_control_plane_audit
from apps.organizations.models import Organization


class AcademicService:
    @staticmethod
    def overview(*, organization: Organization) -> dict:
        terms = AcademicTerm.objects.active().filter(organization=organization).order_by("-starts_on", "code")
        programs = AcademicProgram.objects.active().filter(organization=organization, is_active=True).order_by("name")
        classrooms = (
            AcademicClassroom.objects.active().filter(organization=organization)
            .select_related("program", "term")
            .annotate(active_enrollment_count=Count(
                "enrollments",
                filter=Q(enrollments__status="active", enrollments__deleted_at__isnull=True),
            ))
            .order_by("term__starts_on", "code")
        )
        return {
            "terms": [{
                "id": str(term.id), "code": term.code, "name": term.name,
                "startsOn": term.starts_on.isoformat(), "endsOn": term.ends_on.isoformat(), "status": term.status,
            } for term in terms],
            "programs": [{
                "id": str(program.id), "code": program.code, "name": program.name, "description": program.description,
            } for program in programs],
            "classrooms": [{
                "id": str(item.id), "code": item.code, "name": item.name,
                "program": {"id": str(item.program_id), "name": item.program.name},
                "term": {"id": str(item.term_id), "code": item.term.code},
                "capacity": item.capacity, "status": item.status,
                "activeEnrollmentCount": item.active_enrollment_count,
            } for item in classrooms],
        }

    @staticmethod
    def _validate(instance):
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise ValidationError(exc.message_dict) from exc
            raise ValidationError({"detail": exc.messages}) from exc

    @staticmethod
    def _audit(*, actor, organization, action, resource, instance):
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=actor,
            metadata={
                "organization_id": str(organization.id), "action": action,
                "resource": resource, "resource_id": str(instance.id),
            },
        )

    @staticmethod
    @transaction.atomic
    def create(*, actor, organization, resource: str, data: dict):
        model = {"programs": AcademicProgram, "terms": AcademicTerm, "classrooms": AcademicClassroom}[resource]
        instance = model(organization=organization, **data)
        if resource == "terms" and instance.status != AcademicTerm.Status.DRAFT:
            raise ValidationError({"status": "New academic terms must start in draft status."})
        if resource == "classrooms" and instance.status != AcademicClassroom.Status.DRAFT:
            raise ValidationError({"status": "New classrooms must start in draft status."})
        AcademicService._validate(instance)
        try:
            with transaction.atomic():
                instance.save()
        except IntegrityError as exc:
            raise ValidationError({"code": "A resource with this code already exists."}) from exc
        AcademicService._audit(actor=actor, organization=organization, action="created", resource=resource, instance=instance)
        return instance

    @staticmethod
    def _validate_term_transition(instance, next_status):
        allowed = {
            AcademicTerm.Status.DRAFT: {AcademicTerm.Status.DRAFT, AcademicTerm.Status.ACTIVE},
            AcademicTerm.Status.ACTIVE: {AcademicTerm.Status.ACTIVE, AcademicTerm.Status.CLOSED},
            AcademicTerm.Status.CLOSED: {AcademicTerm.Status.CLOSED},
        }
        if next_status not in allowed[instance.status]:
            raise ValidationError({"status": "Invalid academic term status transition."})
        if next_status == AcademicTerm.Status.ACTIVE and instance.ends_on < timezone.localdate():
            raise ValidationError({"status": "An expired academic term cannot be activated."})

    @staticmethod
    def _validate_classroom_transition(instance, next_status):
        allowed = {
            AcademicClassroom.Status.DRAFT: {AcademicClassroom.Status.DRAFT, AcademicClassroom.Status.OPEN, AcademicClassroom.Status.CANCELLED},
            AcademicClassroom.Status.OPEN: {AcademicClassroom.Status.OPEN, AcademicClassroom.Status.IN_PROGRESS, AcademicClassroom.Status.CANCELLED},
            AcademicClassroom.Status.IN_PROGRESS: {AcademicClassroom.Status.IN_PROGRESS, AcademicClassroom.Status.COMPLETED},
            AcademicClassroom.Status.COMPLETED: {AcademicClassroom.Status.COMPLETED},
            AcademicClassroom.Status.CANCELLED: {AcademicClassroom.Status.CANCELLED},
        }
        if next_status not in allowed[instance.status]:
            raise ValidationError({"status": "Invalid classroom status transition."})
        if next_status == AcademicClassroom.Status.OPEN and instance.term.status != AcademicTerm.Status.ACTIVE:
            raise ValidationError({"status": "A classroom can only open in an active academic term."})

    @staticmethod
    def get_resource(*, organization, resource: str, instance_id, lock=False):
        model = {"programs": AcademicProgram, "terms": AcademicTerm, "classrooms": AcademicClassroom}[resource]
        queryset = model.objects.active().filter(organization=organization)
        if resource == "classrooms":
            queryset = queryset.select_related("program", "term")
        if lock:
            queryset = queryset.select_for_update()
        instance = queryset.filter(id=instance_id).first()
        if instance is None:
            raise NotFound("Academic resource not found.")
        return instance

    @staticmethod
    @transaction.atomic
    def update(*, actor, organization, resource: str, instance_id, data: dict):
        instance = AcademicService.get_resource(organization=organization, resource=resource, instance_id=instance_id, lock=True)
        if resource == "terms" and "status" in data:
            AcademicService._validate_term_transition(instance, data["status"])
        if resource == "classrooms" and "status" in data:
            AcademicService._validate_classroom_transition(instance, data["status"])
        for key, value in data.items():
            setattr(instance, key, value)
        AcademicService._validate(instance)
        try:
            with transaction.atomic():
                instance.save()
        except IntegrityError as exc:
            raise ValidationError({"code": "A resource with this code already exists."}) from exc
        AcademicService._audit(actor=actor, organization=organization, action="updated", resource=resource, instance=instance)
        return instance

    @staticmethod
    @transaction.atomic
    def archive(*, actor, organization, resource: str, instance_id):
        instance = AcademicService.get_resource(organization=organization, resource=resource, instance_id=instance_id, lock=True)
        if resource == "programs" and instance.classrooms.filter(deleted_at__isnull=True).exists():
            raise ValidationError({"detail": "A program with classrooms cannot be archived."})
        if resource == "terms" and instance.classrooms.filter(deleted_at__isnull=True).exists():
            raise ValidationError({"detail": "A term with classrooms cannot be archived."})
        instance.soft_delete()
        AcademicService._audit(actor=actor, organization=organization, action="archived", resource=resource, instance=instance)
        return instance
