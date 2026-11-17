from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.grading_scale_services import AcademicGradingScaleService
from apps.academic.models import AcademicGradingScale
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Organization


class AcademicGradingScaleBandInputSerializer(serializers.Serializer):
    minimum_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    maximum_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    letter_grade = serializers.CharField(max_length=8, trim_whitespace=True)
    grade_points = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=10)
    is_passing = serializers.BooleanField(default=True)


class AcademicGradingScaleInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    maximum_grade_point = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal("0.01"), max_value=Decimal("10"))
    bands = AcademicGradingScaleBandInputSerializer(many=True, allow_empty=False)


class AcademicGradingScaleBandOutputSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    minimum_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    maximum_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    letter_grade = serializers.CharField()
    grade_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    is_passing = serializers.BooleanField()
    position = serializers.IntegerField()


class AcademicGradingScaleOutputSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    version = serializers.IntegerField()
    maximum_grade_point = serializers.DecimalField(max_digits=5, decimal_places=2)
    is_active = serializers.BooleanField()
    bands = AcademicGradingScaleBandOutputSerializer(many=True)


class AcademicGradingScaleView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "PUT" else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _organization(organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise NotFound("Organization not found.")
        return organization

    def get(self, request, organization_id):
        organization = self._organization(organization_id)
        scale = AcademicGradingScale.objects.filter(
            organization=organization, is_active=True, deleted_at__isnull=True,
        ).prefetch_related("bands").first()
        return success_response(
            AcademicGradingScaleOutputSerializer(scale).data if scale else None)

    def put(self, request, organization_id):
        organization = self._organization(organization_id)
        serializer = AcademicGradingScaleInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            scale = AcademicGradingScaleService.publish_scale(
                organization=organization, **serializer.validated_data)
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise ValidationError(exc.message_dict) from exc
            raise ValidationError({"detail": exc.messages}) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.id),
                "action": "published",
                "resource": "grading_scale",
                "resource_id": str(scale.id),
                "version": scale.version,
            },
        )
        scale = AcademicGradingScale.objects.prefetch_related("bands").get(pk=scale.pk)
        return success_response(AcademicGradingScaleOutputSerializer(scale).data)
