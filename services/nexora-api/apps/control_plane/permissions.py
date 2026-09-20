from __future__ import annotations

from rest_framework.permissions import BasePermission

from .models import ControlPlanePermission
from .models import ControlPlanePrincipal


def control_plane_principal(request):
    user_id = request.session.get("control_plane_user_id")
    if not user_id:
        return None
    return (
        ControlPlanePrincipal.objects
        .select_related("user")
        .filter(user_id=user_id, enabled=True, deleted_at__isnull=True)
        .first()
    )


class ControlCenterPermission(BasePermission):
    required_permission: str = ControlPlanePermission.DASHBOARD_READ

    def has_permission(self, request, view) -> bool:
        principal = control_plane_principal(request)
        return principal is not None and principal.has_permission(self.required_permission)


class CanViewControlCenter(ControlCenterPermission):
    required_permission = ControlPlanePermission.DASHBOARD_READ


class CanViewApplications(ControlCenterPermission):
    required_permission = ControlPlanePermission.APPLICATIONS_READ


class CanManageOperations(ControlCenterPermission):
    required_permission = ControlPlanePermission.OPERATIONS_MANAGE


class CanManageSecurity(ControlCenterPermission):
    required_permission = ControlPlanePermission.SECURITY_MANAGE
