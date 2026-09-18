from rest_framework.permissions import BasePermission

from apps.access.services import authorize
from apps.organizations.models import Organization


class NexoraPermission(BasePermission):
    required_permission = ""

    def has_permission(self, request, view):
        organization_id = view.kwargs.get("organization_id")
        organization = Organization.objects.active().filter(id=organization_id).first()
        if organization is None:
            return False
        decision = authorize(
            user=request.user,
            organization=organization,
            permission_code=getattr(view, "required_permission", self.required_permission),
        )
        return decision.allowed


class CanReadOrganization(NexoraPermission):
    required_permission = "organization.read"


class CanReadFinance(NexoraPermission):
    required_permission = "finance.read"


class CanWriteFinance(NexoraPermission):
    required_permission = "finance.write"
