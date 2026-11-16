from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.models import AcademicCourseOffering, AcademicOfferingSchedule
from apps.academic.rules.schedules import AcademicScheduleService
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Organization


class AcademicOfferingScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicOfferingSchedule
        fields = (
            "id", "offering", "weekday", "starts_at", "ends_at",
            "location_label", "delivery_details", "created_at", "updated_at",
        )
        read_only_fields = ("id", "offering", "created_at", "updated_at")


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id,
        status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _audit(*, request, organization, action, slot):
    record_control_plane_audit(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        actor=request.user,
        metadata={
            "organization_id": str(organization.id),
            "action": action,
            "resource": "offering_schedules",
            "resource_id": str(slot.id),
            "offering_id": str(slot.offering_id),
        },
    )


def _translate_validation_error(exc):
    if hasattr(exc, "message_dict"):
        raise ValidationError(exc.message_dict) from exc
    raise ValidationError({"detail": exc.messages}) from exc


class AcademicOfferingScheduleListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = AcademicCourseOffering.objects.active().filter(
            id=offering_id,
            organization=organization,
        ).first()
        if offering is None:
            raise NotFound("Course offering not found.")
        slots = AcademicOfferingSchedule.objects.active().filter(
            organization=organization,
            offering=offering,
        )
        return success_response(AcademicOfferingScheduleSerializer(slots, many=True).data)

    @transaction.atomic
    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = AcademicCourseOffering.objects.active().filter(
            id=offering_id,
            organization=organization,
        ).first()
        if offering is None:
            raise NotFound("Course offering not found.")
        serializer = AcademicOfferingScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            slot = AcademicScheduleService.create_slot(
                organization=organization,
                offering=offering,
                **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate_validation_error(exc)
        _audit(request=request, organization=organization, action="created", slot=slot)
        return success_response(AcademicOfferingScheduleSerializer(slot).data, status=201)


class AcademicOfferingScheduleDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method in {"PATCH", "DELETE"} else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _get(*, organization, slot_id, lock=False):
        queryset = AcademicOfferingSchedule.objects.active().filter(organization=organization)
        if lock:
            queryset = queryset.select_for_update()
        slot = queryset.select_related("offering").filter(id=slot_id).first()
        if slot is None:
            raise NotFound("Schedule slot not found.")
        return slot

    def get(self, request, organization_id, slot_id):
        organization = _organization(organization_id)
        slot = self._get(organization=organization, slot_id=slot_id)
        return success_response(AcademicOfferingScheduleSerializer(slot).data)

    @transaction.atomic
    def patch(self, request, organization_id, slot_id):
        organization = _organization(organization_id)
        slot = self._get(organization=organization, slot_id=slot_id, lock=True)
        serializer = AcademicOfferingScheduleSerializer(slot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            slot = AcademicScheduleService.update_slot(
                organization=organization,
                slot_id=slot.id,
                changes=serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate_validation_error(exc)
        _audit(request=request, organization=organization, action="updated", slot=slot)
        return success_response(AcademicOfferingScheduleSerializer(slot).data)

    @transaction.atomic
    def delete(self, request, organization_id, slot_id):
        organization = _organization(organization_id)
        slot = self._get(organization=organization, slot_id=slot_id, lock=True)
        slot.soft_delete()
        _audit(request=request, organization=organization, action="archived", slot=slot)
        return success_response({"archived": True, "id": str(slot.id)})
