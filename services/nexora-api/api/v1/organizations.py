from __future__ import annotations

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadOrganization
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import NexoraException, PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.organizations.selectors import get_active_membership, get_user_organizations


class OrganizationAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, DRFPermissionDenied):
            return self._error(self.request, PermissionDeniedException("Organization permission is required."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(
            exception.code,
            exception.message,
            details=exception.details,
            correlation_id=getattr(request, "correlation_id", None),
            status=exception.status_code,
        )


class OrganizationListView(OrganizationAPIView):
    def get(self, request):
        organizations = get_user_organizations(request.user)
        data = [
            {
                "id": str(organization.id),
                "name": organization.name,
                "slug": organization.slug,
                "status": organization.status,
            }
            for organization in organizations
        ]
        return success_response(data)


class OrganizationDetailView(OrganizationAPIView):
    permission_classes = [IsAuthenticated, CanReadOrganization]

    def get(self, request, organization_id):
        try:
            membership = get_active_membership(user=request.user, organization_id=organization_id)
            if membership is None:
                raise PermissionDeniedException("Active organization membership is required.")
            organization = membership.organization
            return success_response(
                {
                    "id": str(organization.id),
                    "name": organization.name,
                    "slug": organization.slug,
                    "status": organization.status,
                }
            )
        except NexoraException as exception:
            return self._error(request, exception)


class OrganizationMembershipView(OrganizationAPIView):
    def get(self, request, organization_id):
        try:
            membership = get_active_membership(user=request.user, organization_id=organization_id)
            if membership is None:
                raise PermissionDeniedException("Active organization membership is required.")
            return success_response(
                {
                    "id": str(membership.id),
                    "organization_id": str(membership.organization_id),
                    "role": membership.role.slug.upper(),
                    "status": membership.status,
                }
            )
        except NexoraException as exception:
            return self._error(request, exception)
