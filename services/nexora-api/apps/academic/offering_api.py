from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.models import AcademicCourseOffering
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Organization


class AcademicCourseOfferingSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    classroom_code = serializers.CharField(source="classroom.code", read_only=True)

    class Meta:
        model = AcademicCourseOffering
        fields = (
            "id", "classroom", "classroom_code", "course", "course_code", "course_name",
            "curriculum_entry", "code", "capacity", "status", "created_at", "updated_at",
        )
        read_only_fields = ("id", "classroom_code", "course_code", "course_name", "created_at", "updated_at")


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _validate(instance):
    try:
        instance.full_clean()
    except DjangoValidationError as exc:
        if hasattr(exc, "message_dict"):
            raise ValidationError(exc.message_dict) from exc
        raise ValidationError({"detail": exc.messages}) from exc


def _audit(*, request, organization, action, offering):
    record_control_plane_audit(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        actor=request.user,
        metadata={
            "organization_id": str(organization.id),
            "action": action,
            "resource": "course_offerings",
            "resource_id": str(offering.id),
        },
    )


class AcademicCourseOfferingListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        queryset = AcademicCourseOffering.objects.active().filter(
            organization=organization,
        ).select_related("classroom", "course", "curriculum_entry")
        if classroom_id := request.query_params.get("classroom"):
            queryset = queryset.filter(classroom_id=classroom_id)
        if term_id := request.query_params.get("term"):
            queryset = queryset.filter(classroom__term_id=term_id)
        if program_id := request.query_params.get("program"):
            queryset = queryset.filter(classroom__program_id=program_id)
        if status := request.query_params.get("status"):
            queryset = queryset.filter(status=status)
        return success_response(AcademicCourseOfferingSerializer(queryset, many=True).data)

    @transaction.atomic
    def post(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = AcademicCourseOfferingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        offering = AcademicCourseOffering(organization=organization, **serializer.validated_data)
        _validate(offering)
        try:
            offering.save()
        except IntegrityError as exc:
            raise ValidationError({"code": "An active offering with this code or course already exists in the classroom."}) from exc
        _audit(request=request, organization=organization, action="created", offering=offering)
        return success_response(AcademicCourseOfferingSerializer(offering).data, status=201)


class AcademicCourseOfferingDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method in {"PATCH", "DELETE"} else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _get(organization, offering_id, *, lock=False):
        queryset = AcademicCourseOffering.objects.active().filter(organization=organization)
        if lock:
            queryset = queryset.select_for_update()
        offering = queryset.select_related("classroom", "course", "curriculum_entry").filter(id=offering_id).first()
        if offering is None:
            raise NotFound("Course offering not found.")
        return offering

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = self._get(organization, offering_id)
        return success_response(AcademicCourseOfferingSerializer(offering).data)

    @transaction.atomic
    def patch(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = self._get(organization, offering_id, lock=True)
        serializer = AcademicCourseOfferingSerializer(offering, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for key, value in serializer.validated_data.items():
            setattr(offering, key, value)
        _validate(offering)
        try:
            offering.save()
        except IntegrityError as exc:
            raise ValidationError({"code": "An active offering with this code or course already exists in the classroom."}) from exc
        _audit(request=request, organization=organization, action="updated", offering=offering)
        return success_response(AcademicCourseOfferingSerializer(offering).data)

    @transaction.atomic
    def delete(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = self._get(organization, offering_id, lock=True)
        offering.soft_delete()
        _audit(request=request, organization=organization, action="archived", offering=offering)
        return success_response({"archived": True, "id": str(offering.id)})
