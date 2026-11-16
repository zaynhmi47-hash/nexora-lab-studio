from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.models import AcademicStudyPlan, AcademicStudyPlanItem, AcademicTerm
from apps.academic.study_plan_serializers import (
    AcademicStudyPlanCreateSerializer,
    AcademicStudyPlanItemSerializer,
    AcademicStudyPlanSerializer,
)
from apps.academic.study_plan_services import AcademicStudyPlanService
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Membership, Organization


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _translate_validation_error(exc):
    if hasattr(exc, "message_dict"):
        raise ValidationError(exc.message_dict) from exc
    raise ValidationError({"detail": exc.messages}) from exc


def _audit(*, request, organization, action, plan):
    record_control_plane_audit(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        actor=request.user,
        metadata={
            "organization_id": str(organization.id),
            "action": action,
            "resource": "study_plans",
            "resource_id": str(plan.id),
        },
    )


class AcademicStudyPlanListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        plans = AcademicStudyPlan.objects.active().filter(
            organization=organization, membership__user=request.user,
        ).select_related("term", "membership").prefetch_related("items__offering__course")
        return success_response(AcademicStudyPlanSerializer(plans, many=True).data)

    def post(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = AcademicStudyPlanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = Membership.objects.active().filter(
            organization=organization, user=request.user, status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("An active organization membership is required.")
        term = AcademicTerm.objects.active().filter(
            id=serializer.validated_data["term"], organization=organization,
        ).first()
        if term is None:
            raise NotFound("Academic term not found.")
        try:
            plan = AcademicStudyPlanService.create(
                organization=organization, membership=membership, term=term,
            )
        except DjangoValidationError as exc:
            _translate_validation_error(exc)
        _audit(request=request, organization=organization, action="created", plan=plan)
        return success_response(AcademicStudyPlanSerializer(plan).data, status=201)


class AcademicStudyPlanDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    @staticmethod
    def _get(*, organization, plan_id, user):
        plan = AcademicStudyPlan.objects.active().filter(
            id=plan_id, organization=organization, membership__user=user,
        ).select_related("term", "membership").prefetch_related("items__offering__course").first()
        if plan is None:
            raise NotFound("Study plan not found.")
        return plan

    def get(self, request, organization_id, plan_id):
        organization = _organization(organization_id)
        plan = self._get(organization=organization, plan_id=plan_id, user=request.user)
        return success_response(AcademicStudyPlanSerializer(plan).data)


class AcademicStudyPlanItemCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def post(self, request, organization_id, plan_id):
        organization = _organization(organization_id)
        plan = AcademicStudyPlanDetailView._get(
            organization=organization, plan_id=plan_id, user=request.user,
        )
        serializer = AcademicStudyPlanItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = AcademicStudyPlanService.add_offering(
                plan_id=plan.id, organization=organization,
                offering_id=serializer.validated_data["offering"],
            )
        except DjangoValidationError as exc:
            _translate_validation_error(exc)
        _audit(request=request, organization=organization, action="course_added", plan=plan)
        return success_response(AcademicStudyPlanItemSerializer(item).data, status=201)


class AcademicStudyPlanItemDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    @transaction.atomic
    def delete(self, request, organization_id, plan_id, item_id):
        organization = _organization(organization_id)
        plan = AcademicStudyPlan.objects.select_for_update().filter(
            id=plan_id, organization=organization, membership__user=request.user,
            deleted_at__isnull=True,
        ).first()
        if plan is None:
            raise NotFound("Study plan not found.")
        if plan.status != AcademicStudyPlan.Status.DRAFT:
            raise ValidationError({"status": "Only draft study plans can be edited."})
        item = AcademicStudyPlanItem.objects.select_for_update().filter(
            id=item_id, study_plan=plan, organization=organization, deleted_at__isnull=True,
        ).first()
        if item is None:
            raise NotFound("Study plan item not found.")
        item.soft_delete()
        _audit(request=request, organization=organization, action="course_removed", plan=plan)
        return success_response({"removed": True, "id": str(item.id)})


class AcademicStudyPlanSubmitView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def post(self, request, organization_id, plan_id):
        organization = _organization(organization_id)
        plan = AcademicStudyPlanDetailView._get(
            organization=organization, plan_id=plan_id, user=request.user,
        )
        try:
            plan = AcademicStudyPlanService.submit(plan_id=plan.id, organization=organization)
        except DjangoValidationError as exc:
            _translate_validation_error(exc)
        _audit(request=request, organization=organization, action="submitted", plan=plan)
        return success_response(AcademicStudyPlanSerializer(plan).data)
