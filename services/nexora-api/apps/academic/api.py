from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.core.api.response import success_response
from apps.organizations.models import Organization

from .services import AcademicService


class AcademicOverviewView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def get(self, request, organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
        ).first()
        if organization is None:
            return Response({"detail": "Organization not found."}, status=404)
        return success_response(AcademicService.overview(organization=organization))
