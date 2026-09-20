from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views import View

from .audit import ControlPlaneAuditEvent, ControlPlaneAuditEventType, record_control_plane_audit
from .diagnostics import (
    api_route_diagnostic,
    database_diagnostic,
    firebase_configuration_diagnostic,
    overall_operations_status,
    route_inventory,
)
from .models import ControlPlaneBootstrapState, ControlPlanePermission, ControlPlanePrincipal, ControlPlaneRole
from .registry import application_snapshot
from .telemetry import clear_requests, recent_requests


def _actor(request):
    user_id = request.session.get("control_plane_user_id")
    if not user_id:
        return None
    return (
        ControlPlanePrincipal.objects.select_related("user")
        .filter(user_id=user_id, enabled=True, deleted_at__isnull=True)
        .first()
    )


def _guard(request, permission):
    if not settings.DEBUG:
        return None, JsonResponse({"detail": "Control Plane is disabled outside DEBUG."}, status=404)
    actor = _actor(request)
    if actor is None:
        return None, JsonResponse({"detail": "Control Center authentication is required."}, status=401)
    if not actor.has_permission(permission):
        return None, JsonResponse({"detail": "Control Center permission denied."}, status=403)
    return actor, None


class ControlPlaneSecurityOverviewView(View):
    """Read-only security posture for Security Admins, Owners and Auditors."""

    def get(self, request):
        actor, error = _guard(request, ControlPlanePermission.SECURITY_READ)
        if error:
            return error

        now = timezone.now()
        failed_since = now - timedelta(hours=24)
        principals = ControlPlanePrincipal.objects.filter(deleted_at__isnull=True)
        role_counts = {role: principals.filter(role=role).count() for role in ControlPlaneRole.values}
        disabled_count = principals.filter(enabled=False).count()
        failed_logins_24h = ControlPlaneAuditEvent.objects.filter(
            event_type=ControlPlaneAuditEventType.LOGIN_FAILED,
            occurred_at__gte=failed_since,
        ).count()
        bootstrap = ControlPlaneBootstrapState.objects.get(pk=1)

        return JsonResponse({
            "authenticated_as": {
                "user_id": str(actor.user_id),
                "email": actor.user.email,
                "role": actor.role,
            },
            "bootstrap": {
                "locked": bootstrap.locked,
                "locked_at": bootstrap.locked_at.isoformat() if bootstrap.locked_at else None,
            },
            "principals": {
                "total": principals.count(),
                "owners": role_counts[ControlPlaneRole.OWNER],
                "platform_admins": role_counts[ControlPlaneRole.PLATFORM_ADMIN],
                "security_admins": role_counts[ControlPlaneRole.SECURITY_ADMIN],
                "auditors": role_counts[ControlPlaneRole.AUDITOR],
                "disabled": disabled_count,
            },
            "failed_logins_24h": failed_logins_24h,
            "generated_at": now.isoformat(),
        })


class ControlPlaneOperationsOverviewView(View):
    """Read-only operational diagnostics plus explicitly safe DEBUG-only actions."""

    def get(self, request):
        actor, error = _guard(request, ControlPlanePermission.SERVICES_READ)
        if error:
            return error

        checked_at = timezone.now().isoformat()
        routes = route_inventory()
        diagnostics = {
            "database": database_diagnostic(checked_at=checked_at),
            "firebase": firebase_configuration_diagnostic(checked_at=checked_at),
            "api": api_route_diagnostic(routes, checked_at=checked_at),
        }

        return JsonResponse({
            "operator": {"email": actor.user.email, "role": actor.role},
            "status": overall_operations_status(diagnostics),
            "checked_at": checked_at,
            "diagnostics": diagnostics,
            "applications": application_snapshot(routes),
            "recent_requests": recent_requests(50),
            "actions": {
                "clear_request_telemetry": actor.has_permission(ControlPlanePermission.OPERATIONS_MANAGE),
            },
        })


class ControlPlaneClearTelemetryView(View):
    """Clear only bounded in-memory request telemetry; never touches application data."""

    def post(self, request):
        actor, error = _guard(request, ControlPlanePermission.OPERATIONS_MANAGE)
        if error:
            return error
        cleared = clear_requests()
        record_control_plane_audit(
            event_type=ControlPlaneAuditEventType.TELEMETRY_CLEARED,
            actor=actor.user,
            success=True,
            correlation_id=request.headers.get("X-Request-ID", ""),
            metadata={"cleared_events": cleared},
        )
        return JsonResponse({"cleared_events": cleared, "detail": "Request telemetry cleared."})
