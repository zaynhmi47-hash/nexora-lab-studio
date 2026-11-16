from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.serializers import AcademicClassroomSerializer, AcademicProgramSerializer, AcademicTermSerializer
from apps.academic.services import AcademicService
from apps.core.api.response import success_response
from apps.organizations.models import Organization

from .models import AcademicClassroom, AcademicProgram, AcademicTerm


SERIALIZERS = {
    "programs": AcademicProgramSerializer,
    "terms": AcademicTermSerializer,
    "classrooms": AcademicClassroomSerializer,
}
MODELS = {
    "programs": AcademicProgram,
    "terms": AcademicTerm,
    "classrooms": AcademicClassroom,
}


class AcademicOverviewView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def get(self, request, organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            return Response({"detail": "Organization not found."}, status=404)
        return success_response(AcademicService.overview(organization=organization))


class AcademicResourceListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _resource(resource):
        if resource not in SERIALIZERS:
            raise NotFound("Academic resource not found.")
        return resource

    @staticmethod
    def _organization(organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise NotFound("Organization not found.")
        return organization

    def get(self, request, organization_id, resource):
        resource = self._resource(resource)
        organization = self._organization(organization_id)
        queryset = MODELS[resource].objects.active().filter(organization=organization)
        if resource == "classrooms":
            queryset = queryset.select_related("program", "term")
        return success_response(SERIALIZERS[resource](queryset, many=True).data)

    def post(self, request, organization_id, resource):
        resource = self._resource(resource)
        organization = self._organization(organization_id)
        serializer = SERIALIZERS[resource](data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = AcademicService.create(
            actor=request.user, organization=organization, resource=resource, data=serializer.validated_data,
        )
        return success_response(SERIALIZERS[resource](instance).data, status=201)


class AcademicResourceDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method in {"PATCH", "DELETE"} else "academic.read"
        return super().get_permissions()

    @staticmethod
    def _resource(resource):
        if resource not in SERIALIZERS:
            raise NotFound("Academic resource not found.")
        return resource

    @staticmethod
    def _organization(organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id, status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            raise NotFound("Organization not found.")
        return organization

    def get(self, request, organization_id, resource, resource_id):
        resource = self._resource(resource)
        organization = self._organization(organization_id)
        instance = AcademicService.get_resource(organization=organization, resource=resource, instance_id=resource_id)
        return success_response(SERIALIZERS[resource](instance).data)

    def patch(self, request, organization_id, resource, resource_id):
        resource = self._resource(resource)
        organization = self._organization(organization_id)
        instance = AcademicService.get_resource(organization=organization, resource=resource, instance_id=resource_id)
        serializer = SERIALIZERS[resource](instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = AcademicService.update(
            actor=request.user, organization=organization, resource=resource,
            instance_id=resource_id, data=serializer.validated_data,
        )
        return success_response(SERIALIZERS[resource](updated).data)

    def delete(self, request, organization_id, resource, resource_id):
        resource = self._resource(resource)
        organization = self._organization(organization_id)
        AcademicService.archive(
            actor=request.user, organization=organization, resource=resource, instance_id=resource_id,
        )
        return success_response({"archived": True, "id": str(resource_id)})
