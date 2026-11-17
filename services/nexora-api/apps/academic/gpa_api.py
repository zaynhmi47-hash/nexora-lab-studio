from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.gpa_services import AcademicGpaService
from apps.academic.models import (
    AcademicGpaCalculation,
    AcademicGpaPolicy,
    AcademicGradingScale,
    AcademicTerm,
)
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Membership, Organization


class GpaPolicyInputSerializer(serializers.Serializer):
    grading_scale_id = serializers.UUIDField()
    retake_strategy = serializers.ChoiceField(choices=AcademicGpaPolicy.RetakeStrategy.choices)
    include_failed_grades = serializers.BooleanField(default=True)


class GpaCalculationInputSerializer(serializers.Serializer):
    membership_id = serializers.UUIDField()
    term_id = serializers.UUIDField()


class GpaPolicyOutputSerializer(serializers.ModelSerializer):
    grading_scale_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = AcademicGpaPolicy
        fields = (
            "id", "version", "grading_scale_id", "retake_strategy",
            "include_failed_grades", "is_active",
        )


class GpaCalculationOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicGpaCalculation
        fields = (
            "id", "calculation_version", "term", "policy",
            "term_gpa", "cumulative_gpa",
            "term_attempted_credits", "term_earned_credits",
            "cumulative_attempted_credits", "cumulative_earned_credits",
            "details", "calculated_at",
        )


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


class AcademicGpaPolicyView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "PUT" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        policy = AcademicGpaPolicy.objects.filter(
            organization=organization, is_active=True, deleted_at__isnull=True,
        ).first()
        return success_response(GpaPolicyOutputSerializer(policy).data if policy else None)

    def put(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = GpaPolicyInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scale = AcademicGradingScale.objects.filter(
            id=serializer.validated_data["grading_scale_id"],
            organization=organization,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if scale is None:
            raise NotFound("Active grading scale not found.")
        try:
            policy = AcademicGpaService.publish_policy(
                organization=organization,
                grading_scale=scale,
                retake_strategy=serializer.validated_data["retake_strategy"],
                include_failed_grades=serializer.validated_data["include_failed_grades"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.id),
                "action": "published",
                "resource": "gpa_policy",
                "resource_id": str(policy.id),
                "version": policy.version,
                "grading_scale_id": str(scale.id),
            },
        )
        return success_response(GpaPolicyOutputSerializer(policy).data)


class AcademicGpaCalculationView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.grade" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        membership_id = request.query_params.get("membership_id")
        term_id = request.query_params.get("term_id")
        if not membership_id or not term_id:
            raise ValidationError({"detail": "membership_id and term_id are required."})
        queryset = AcademicGpaCalculation.objects.filter(
            organization=organization,
            membership_id=membership_id,
            term_id=term_id,
            deleted_at__isnull=True,
        ).select_related("policy", "term")
        if not request.user.is_staff:
            queryset = queryset.filter(membership__user=request.user)
        calculation = queryset.order_by("-calculation_version").first()
        if calculation is None:
            raise NotFound("GPA calculation not found.")
        return success_response(GpaCalculationOutputSerializer(calculation).data)

    def post(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = GpaCalculationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = Membership.objects.active().filter(
            id=serializer.validated_data["membership_id"],
            organization=organization,
            status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("Active student membership not found.")
        if not request.user.is_staff and membership.user_id != request.user.id:
            raise NotFound("Student membership not found.")
        term = AcademicTerm.objects.active().filter(
            id=serializer.validated_data["term_id"],
            organization=organization,
        ).first()
        if term is None:
            raise NotFound("Academic term not found.")
        try:
            calculation = AcademicGpaService.calculate(
                organization=organization,
                membership=membership,
                term=term,
                calculated_by=request.user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.id),
                "action": "calculated",
                "resource": "gpa_calculation",
                "resource_id": str(calculation.id),
                "membership_id": str(membership.id),
                "term_id": str(term.id),
                "calculation_version": calculation.calculation_version,
            },
        )
        return success_response(GpaCalculationOutputSerializer(calculation).data, status=201)
