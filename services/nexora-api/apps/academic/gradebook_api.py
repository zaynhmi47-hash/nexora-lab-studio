from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.gradebook_serializers import (
    AcademicAssessmentComponentSerializer,
    AcademicFinalGradeSerializer,
    AcademicGradeEntrySerializer,
    AcademicGradingPolicySerializer,
)
from apps.academic.gradebook_services import AcademicGradebookService
from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicFinalGrade,
    AcademicGradeEntry,
    AcademicGradingPolicy,
)
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Membership, Organization


class GradingPolicyInputSerializer(serializers.Serializer):
    max_score = serializers.DecimalField(max_digits=7, decimal_places=2, required=False, default=100)
    passing_score = serializers.DecimalField(max_digits=7, decimal_places=2, required=False, allow_null=True, default=None)


class FinalGradePublishInputSerializer(serializers.Serializer):
    membership = serializers.UUIDField()


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _offering(organization, offering_id):
    offering = AcademicCourseOffering.objects.active().filter(
        id=offering_id, organization=organization,
    ).select_related("classroom", "course").first()
    if offering is None:
        raise NotFound("Course offering not found.")
    return offering


def _translate(exc):
    if hasattr(exc, "message_dict"):
        raise ValidationError(exc.message_dict) from exc
    raise ValidationError({"detail": exc.messages}) from exc


def _audit(request, organization, action, resource, resource_id):
    record_control_plane_audit(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        actor=request.user,
        metadata={
            "organization_id": str(organization.id),
            "action": action,
            "resource": resource,
            "resource_id": str(resource_id),
        },
    )


def _is_assigned_instructor(*, organization, offering, user):
    membership = Membership.objects.active().filter(
        organization=organization, user=user, status=Membership.Status.ACTIVE,
    ).first()
    return bool(membership and AcademicEnrollment.objects.active().filter(
        organization=organization, classroom=offering.classroom,
        membership=membership, role=AcademicEnrollment.Role.INSTRUCTOR,
        status=AcademicEnrollment.Status.ACTIVE,
    ).exists())


class AcademicGradingPolicyView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.manage"

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        policy = AcademicGradingPolicy.objects.filter(
            organization=organization, offering=offering, is_active=True, deleted_at__isnull=True,
        ).first()
        return success_response(AcademicGradingPolicySerializer(policy).data if policy else None)

    def put(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        serializer = GradingPolicyInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            policy = AcademicGradebookService.configure_policy(
                organization=organization, offering=offering, **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        _audit(request, organization, "configured", "grading_policy", policy.pk)
        return success_response(AcademicGradingPolicySerializer(policy).data)


class AcademicAssessmentComponentListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        components = AcademicAssessmentComponent.objects.active().filter(
            organization=organization, offering=offering,
        )
        return success_response(AcademicAssessmentComponentSerializer(components, many=True).data)

    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        serializer = AcademicAssessmentComponentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            component = AcademicGradebookService.create_component(
                organization=organization, offering=offering, **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        except IntegrityError as exc:
            raise ValidationError({"name": "An active assessment component with this name already exists."}) from exc
        _audit(request, organization, "created", "assessment_component", component.pk)
        return success_response(AcademicAssessmentComponentSerializer(component).data, status=201)


class AcademicGradeEntryListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        queryset = AcademicGradeEntry.objects.active().filter(
            organization=organization, offering=offering,
        ).select_related("component", "membership", "graded_by")
        if not request.user.is_staff and not _is_assigned_instructor(
            organization=organization, offering=offering, user=request.user,
        ):
            queryset = queryset.filter(
                membership__user=request.user, status=AcademicGradeEntry.Status.PUBLISHED,
            )
        return success_response(AcademicGradeEntrySerializer(queryset, many=True).data)

    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        serializer = AcademicGradeEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        component = AcademicAssessmentComponent.objects.active().filter(
            id=serializer.validated_data["component"].id,
            organization=organization, offering=offering,
        ).first()
        if component is None:
            raise NotFound("Assessment component not found.")
        membership = Membership.objects.active().filter(
            id=serializer.validated_data["membership"].id,
            organization=organization, status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("Active student membership not found.")
        try:
            entry = AcademicGradebookService.record_grade(
                organization=organization, offering=offering, component=component,
                membership=membership, score=serializer.validated_data["score"],
                graded_by=request.user,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        _audit(request, organization, "recorded", "grade_entry", entry.pk)
        return success_response(AcademicGradeEntrySerializer(entry).data, status=201)


class AcademicGradeEntryPublishView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.manage"

    def post(self, request, organization_id, entry_id):
        organization = _organization(organization_id)
        entry = AcademicGradeEntry.objects.active().filter(
            id=entry_id, organization=organization,
        ).select_related("offering", "component", "membership").first()
        if entry is None:
            raise NotFound("Grade entry not found.")
        try:
            entry = AcademicGradebookService.publish_component_grade(entry=entry, published_by=request.user)
        except DjangoValidationError as exc:
            _translate(exc)
        _audit(request, organization, "published", "grade_entry", entry.pk)
        return success_response(AcademicGradeEntrySerializer(entry).data)


class AcademicFinalGradeListPublishView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        queryset = AcademicFinalGrade.objects.active().filter(
            organization=organization, offering=offering, status=AcademicFinalGrade.Status.PUBLISHED,
        ).select_related("offering__course", "published_by")
        if not request.user.is_staff and not _is_assigned_instructor(
            organization=organization, offering=offering, user=request.user,
        ):
            queryset = queryset.filter(membership__user=request.user)
        return success_response(AcademicFinalGradeSerializer(queryset, many=True).data)

    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = _offering(organization, offering_id)
        serializer = FinalGradePublishInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = Membership.objects.active().filter(
            id=serializer.validated_data["membership"], organization=organization,
            status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("Active student membership not found.")
        try:
            grade = AcademicGradebookService.publish_final_grade(
                organization=organization, offering=offering, membership=membership,
                published_by=request.user,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        _audit(request, organization, "published", "final_grade", grade.pk)
        return success_response(AcademicFinalGradeSerializer(grade).data, status=201)
