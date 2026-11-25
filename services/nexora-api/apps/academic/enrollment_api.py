from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.enrollment_serializers import (
    AcademicEnrollmentCreateSerializer,
    AcademicEnrollmentSerializer,
    AcademicEnrollmentStatusSerializer,
)
from apps.academic.enrollment_services import AcademicEnrollmentService
from apps.academic.models import AcademicClassroom, AcademicEnrollment
from apps.core.api.response import success_response
from apps.organizations.models import Organization


class AcademicEnrollmentListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _organization(organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise NotFound("Organization not found.")
        return organization

    def get(self, request, organization_id, classroom_id):
        organization = self._organization(organization_id)
        classroom = AcademicClassroom.objects.active().filter(
            id=classroom_id, organization=organization,
        ).first()
        if classroom is None:
            raise NotFound("Academic classroom not found.")
        enrollments = AcademicEnrollment.objects.active().filter(
            organization=organization, classroom=classroom,
        ).select_related("membership", "term").order_by("created_at", "id")
        return success_response(AcademicEnrollmentSerializer(enrollments, many=True).data)

    def post(self, request, organization_id, classroom_id):
        organization = self._organization(organization_id)
        serializer = AcademicEnrollmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = AcademicEnrollmentService.create(
            actor=request.user,
            organization=organization,
            classroom_id=classroom_id,
            **serializer.validated_data,
        )
        return success_response(AcademicEnrollmentSerializer(enrollment).data, status=201)


class AcademicEnrollmentDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "PATCH" else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _organization(organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise NotFound("Organization not found.")
        return organization

    def get(self, request, organization_id, enrollment_id):
        organization = self._organization(organization_id)
        enrollment = AcademicEnrollmentService.get_enrollment(
            organization=organization, enrollment_id=enrollment_id,
        )
        return success_response(AcademicEnrollmentSerializer(enrollment).data)

    def patch(self, request, organization_id, enrollment_id):
        organization = self._organization(organization_id)
        serializer = AcademicEnrollmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = AcademicEnrollmentService.change_status(
            actor=request.user,
            organization=organization,
            enrollment_id=enrollment_id,
            **serializer.validated_data,
        )
        return success_response(AcademicEnrollmentSerializer(enrollment).data)
