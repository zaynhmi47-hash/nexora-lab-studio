from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.gradebook_serializers import (
    AcademicAssessmentComponentCreateSerializer,
    AcademicAssessmentComponentSerializer,
    AcademicFinalGradeSerializer,
    AcademicGradeEntryCreateSerializer,
    AcademicGradeEntrySerializer,
    AcademicGradingPolicyCreateSerializer,
    AcademicGradingPolicySerializer,
)
from apps.academic.gradebook_services import AcademicGradebookService
from apps.academic.models import AcademicFinalGrade, AcademicGradeEntry, AcademicGradingPolicy, AcademicCourseOffering
from apps.core.api.response import success_response
from apps.organizations.models import Organization


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _translate(exc):
    if hasattr(exc, "message_dict"):
        raise ValidationError(exc.message_dict) from exc
    raise ValidationError({"detail": exc.messages}) from exc


class AcademicGradingPolicyView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.read" if self.request.method == "GET" else "academic.grade"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = AcademicCourseOffering.objects.active().filter(id=offering_id, organization=organization).first()
        if offering is None:
            raise NotFound("Course offering not found.")
        policy = AcademicGradingPolicy.objects.filter(organization=organization, offering=offering, deleted_at__isnull=True).first()
        if policy is None:
            raise NotFound("Grading policy not found.")
        return success_response(AcademicGradingPolicySerializer(policy).data)

    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        serializer = AcademicGradingPolicyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            policy = AcademicGradebookService.create_policy(
                actor=request.user, organization=organization, offering_id=offering_id,
                **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        return success_response(AcademicGradingPolicySerializer(policy).data, status=201)


class AcademicAssessmentComponentCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.grade"

    def post(self, request, organization_id, policy_id):
        organization = _organization(organization_id)
        serializer = AcademicAssessmentComponentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            component = AcademicGradebookService.add_component(
                actor=request.user, organization=organization, policy_id=policy_id,
                **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        return success_response(AcademicAssessmentComponentSerializer(component).data, status=201)


class AcademicGradingPolicyActivateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.grade"

    def post(self, request, organization_id, policy_id):
        organization = _organization(organization_id)
        try:
            policy = AcademicGradebookService.activate_policy(
                actor=request.user, organization=organization, policy_id=policy_id,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        return success_response(AcademicGradingPolicySerializer(policy).data)


class AcademicGradeEntryListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.read" if self.request.method == "GET" else "academic.grade"
        return super().get_permissions()

    def get(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        offering = AcademicCourseOffering.objects.active().filter(id=offering_id, organization=organization).first()
        if offering is None:
            raise NotFound("Course offering not found.")
        # Students may only read their own published grade entries.
        instructor = AcademicGradebookService._instructor_enrollment(organization, offering, request.user)
        queryset = AcademicGradeEntry.objects.filter(
            organization=organization, offering=offering, deleted_at__isnull=True,
        ).select_related("component", "membership").order_by("membership_id", "component__sequence", "-revision")
        if not instructor:
            queryset = queryset.filter(membership__user=request.user, status=AcademicGradeEntry.Status.PUBLISHED)
        return success_response(AcademicGradeEntrySerializer(queryset, many=True).data)

    def post(self, request, organization_id, offering_id):
        organization = _organization(organization_id)
        serializer = AcademicGradeEntryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            entry = AcademicGradebookService.record_grade(
                actor=request.user, organization=organization, offering_id=offering_id,
                **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        return success_response(AcademicGradeEntrySerializer(entry).data, status=201)


class AcademicGradeEntryPublishView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.grade"

    def post(self, request, organization_id, grade_entry_id):
        organization = _organization(organization_id)
        try:
            result = AcademicGradebookService.publish_grade(
                actor=request.user, organization=organization, grade_entry_id=grade_entry_id,
            )
        except DjangoValidationError as exc:
            _translate(exc)
        payload = {
            "entry": AcademicGradeEntrySerializer(result["entry"]).data,
            "status": result["status"],
            "final_grade": AcademicFinalGradeSerializer(result["final_grade"]).data if result["final_grade"] else None,
        }
        return success_response(payload)


class AcademicMyFinalGradesView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        grades = AcademicFinalGrade.objects.filter(
            organization=organization, membership__user=request.user,
            status=AcademicFinalGrade.Status.PUBLISHED,
        ).select_related("offering", "offering__course").order_by("-published_at", "-revision")
        return success_response(AcademicFinalGradeSerializer(grades, many=True).data)
