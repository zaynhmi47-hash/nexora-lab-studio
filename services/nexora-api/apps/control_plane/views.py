from __future__ import annotations

from time import monotonic
from datetime import datetime
from threading import Lock

from django.conf import settings
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect, render
from django.views import View
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import (
    ControlPlaneAuditEvent,
    ControlPlaneAuditEventType,
    normalize_audit_correlation_id,
    record_control_plane_audit,
)
from .diagnostics import database_diagnostic, route_inventory
from .models import ControlPlanePermission, ControlPlanePrincipal, ControlPlaneRole
from .registry import application_snapshot
from .services import (
    ControlPlaneAccessDenied,
    ControlPlaneRoleManagementError,
    authenticate_control_plane_token,
    manage_control_plane_principal,
)
from .telemetry import recent_requests

_LOGIN_ATTEMPTS: dict[str, list[float]] = {}
_LOGIN_ATTEMPTS_LOCK = Lock()


def _login_rate_limited(request) -> bool:
    now = monotonic()
    key = request.META.get("REMOTE_ADDR", "unknown")
    with _LOGIN_ATTEMPTS_LOCK:
        attempts = [t for t in _LOGIN_ATTEMPTS.get(key, []) if now - t < 60]
        if len(attempts) >= settings.CONTROL_PLANE_LOGIN_RATE_LIMIT:
            _LOGIN_ATTEMPTS[key] = attempts
            return True
        attempts.append(now)
        _LOGIN_ATTEMPTS[key] = attempts
        if len(_LOGIN_ATTEMPTS) > 2048:
            oldest_key = min(_LOGIN_ATTEMPTS, key=lambda item: _LOGIN_ATTEMPTS[item][-1])
            if oldest_key != key:
                _LOGIN_ATTEMPTS.pop(oldest_key, None)
        return False


def _request_correlation_id(request) -> str:
    value = getattr(request, "correlation_id", "") or getattr(request, "request_id", "")
    return str(value)[:128]


def _control_plane_internal_error(request):
    return JsonResponse(
        {
            "detail": "Control Center request could not be completed.",
            "correlation_id": _request_correlation_id(request),
        },
        status=500,
    )


def _control_plane_user(request):
    user_id = request.session.get("control_plane_user_id")
    if not user_id:
        return None
    principal = (
        ControlPlanePrincipal.objects.select_related("user")
        .filter(user_id=user_id, enabled=True, deleted_at__isnull=True)
        .first()
    )
    return principal.user if principal else None


@method_decorator(never_cache, name="dispatch")
@method_decorator(csrf_protect, name="post")
class ControlPlaneLoginView(View):
    def get(self, request):
        if not settings.DEBUG:
            return HttpResponseForbidden("Control Plane is available only in DEBUG mode.")
        if _control_plane_user(request):
            return redirect("control_plane:dashboard")
        return render(request, "control_plane/login.html")

    def post(self, request):
        if not settings.DEBUG:
            return HttpResponseForbidden("Control Plane is available only in DEBUG mode.")
        if _login_rate_limited(request):
            return render(request, "control_plane/login.html", {"error": "Too many login attempts. Try again later."}, status=429)
        token = request.POST.get("id_token", "").strip()
        if len(token) > 8192:
            return render(request, "control_plane/login.html", {"error": "Firebase ID token is too large."}, status=400)
        if not token:
            return render(request, "control_plane/login.html", {"error": "Firebase ID token is required."}, status=400)
        try:
            user = authenticate_control_plane_token(token)
        except ControlPlaneAccessDenied as exc:
            record_control_plane_audit(
                event_type=ControlPlaneAuditEventType.LOGIN_FAILED,
                success=False,
                correlation_id=_request_correlation_id(request),
                metadata={"reason": "access_denied", "error_type": exc.__class__.__name__},
            )
            return render(request, "control_plane/login.html", {"error": str(exc)}, status=403)
        except Exception as exc:
            record_control_plane_audit(
                event_type=ControlPlaneAuditEventType.LOGIN_FAILED,
                success=False,
                correlation_id=request.headers.get("X-Request-ID", ""),
                metadata={"reason": "authentication_error", "error_type": exc.__class__.__name__},
            )
            return render(request, "control_plane/login.html", {"error": "Authentication failed."}, status=403)
        request.session.cycle_key()
        request.session.set_expiry(settings.CONTROL_PLANE_SESSION_AGE)
        request.session["control_plane_user_id"] = str(user.id)
        return redirect("control_plane:dashboard")


class ControlPlaneLogoutView(View):
    @method_decorator(csrf_protect)
    def post(self, request):
        request.session.flush()
        return redirect("control_plane:login")


class ControlPlaneDashboardView(View):
    def get(self, request):
        if not settings.DEBUG:
            return HttpResponseForbidden("Control Plane is available only in DEBUG mode.")
        user = _control_plane_user(request)
        if user is None or not user.control_plane_principal.has_permission(ControlPlanePermission.DASHBOARD_READ):
            return redirect("control_plane:login")
        return render(request, "control_plane/dashboard.html")


class ControlPlaneSnapshotView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not settings.DEBUG:
            return Response({"detail": "Control Plane is disabled outside DEBUG."}, status=404)
        user = _control_plane_user(request)
        if user is None:
            return Response({"detail": "Control Center authentication is required."}, status=401)
        if not user.control_plane_principal.has_permission(ControlPlanePermission.DASHBOARD_READ):
            return Response({"detail": "Control Center permission denied."}, status=403)

        routes = route_inventory()
        db_diagnostic = database_diagnostic()
        healthy_db = db_diagnostic["status"] == "healthy"
        db_detail = (
            f'{db_diagnostic["latency_ms"]:.1f} ms'
            if db_diagnostic["latency_ms"] is not None
            else str(db_diagnostic["details"].get("error_type", "unavailable"))
        )
        from infrastructure.firebase.health import check_firebase_configuration
        firebase_configured = check_firebase_configuration()

        from collections import Counter
        prefix_counts = Counter(
            route["route"].split("/")[3] if len(route["route"].split("/")) > 3 else "root"
            for route in routes
            if route["route"].startswith("/api/")
        )

        snapshot = {
            "environment": "development",
            "debug": settings.DEBUG,
            "database": {"ok": healthy_db, "detail": db_detail},
            "firebase": {"configured": firebase_configured},
            "route_count": len(routes),
            "api_route_count": sum(prefix_counts.values()),
            "api_groups": [{"name": name, "routes": count} for name, count in sorted(prefix_counts.items())],
            "routes": routes,
            "applications": application_snapshot(routes),
            "recent_requests": recent_requests(50),
            "services": [
                {
                    "name": "Nexora API",
                    "kind": "core",
                    "status": "healthy" if healthy_db else "degraded",
                    "description": "Django REST API and shared application domains",
                },
                {
                    "name": "Identity",
                    "kind": "core",
                    "status": "configured",
                    "description": "Internal NEXORA identity with Firebase token verification",
                },
                {
                    "name": "Firebase",
                    "kind": "infrastructure",
                    "status": "configured" if firebase_configured else "not-configured",
                    "description": "Provider adapter for Firebase services",
                },
                {
                    "name": "Muslim",
                    "kind": "domain",
                    "status": "available" if any(r["route"].startswith("/api/v1/learning") for r in routes) else "pending",
                    "description": "Learning, Quran, Tajwid, Arabic, prayer and related Muslim features",
                },
                {
                    "name": "Finance",
                    "kind": "domain",
                    "status": "available" if any("/finance/" in r["route"] for r in routes) else "pending",
                    "description": "Transactions, budgets, goals and financial reporting",
                },
            ],
        }
        return Response(snapshot)


class ControlPlaneAuditLogView(View):
    """Read-only security audit log for authorized Control Center operators."""

    def get(self, request):
        if not settings.DEBUG:
            return JsonResponse({"detail": "Control Plane is disabled outside DEBUG."}, status=404)

        try:
            actor = ControlPlanePrincipal.objects.select_related("user").filter(
                user_id=request.session.get("control_plane_user_id"),
                enabled=True,
                deleted_at__isnull=True,
            ).first()
        except Exception:
            return _control_plane_internal_error(request)
        if actor is None:
            return JsonResponse({"detail": "Control Center authentication is required."}, status=401)
        if not actor.has_permission(ControlPlanePermission.AUDIT_READ):
            return JsonResponse({"detail": "Audit read permission is required."}, status=403)

        try:
            limit = min(max(int(request.GET.get("limit", "50")), 1), 100)
        except ValueError:
            return JsonResponse({"detail": "limit must be an integer."}, status=400)

        event_type = request.GET.get("event_type", "").strip()
        success_filter = request.GET.get("success", "").strip().lower()
        actor_email = request.GET.get("actor", "").strip()
        target_email = request.GET.get("target", "").strip()
        correlation_id = request.GET.get("correlation_id", "").strip()
        try:
            correlation_id = normalize_audit_correlation_id(correlation_id)
        except ValueError:
            return JsonResponse({"detail": "correlation_id is too long."}, status=400)
        if len(actor_email) > 254 or len(target_email) > 254:
            return JsonResponse({"detail": "actor and target filters are too long."}, status=400)
        occurred_before = request.GET.get("occurred_before", "").strip()
        occurred_after = request.GET.get("occurred_after", "").strip()
        parsed_before = parsed_after = None
        for raw, label in ((occurred_before, "occurred_before"), (occurred_after, "occurred_after")):
            if not raw:
                continue
            try:
                parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except ValueError:
                return JsonResponse({"detail": f"{label} must be an ISO-8601 timestamp."}, status=400)
            if label == "occurred_before":
                parsed_before = parsed
            else:
                parsed_after = parsed
        if parsed_before and parsed_after and parsed_after >= parsed_before:
            return JsonResponse({"detail": "occurred_after must be earlier than occurred_before."}, status=400)

        try:
            queryset = ControlPlaneAuditEvent.objects.select_related("actor", "target")
        except Exception:
            return _control_plane_internal_error(request)
        if event_type:
            if event_type not in set(ControlPlaneAuditEventType.values):
                return JsonResponse({"detail": "Unknown audit event type."}, status=400)
            queryset = queryset.filter(event_type=event_type)
        if success_filter:
            if success_filter not in {"true", "false"}:
                return JsonResponse({"detail": "success must be true or false."}, status=400)
            queryset = queryset.filter(success=success_filter == "true")
        if actor_email:
            queryset = queryset.filter(actor__email__icontains=actor_email)
        if target_email:
            queryset = queryset.filter(target__email__icontains=target_email)
        if correlation_id:
            queryset = queryset.filter(correlation_id=correlation_id)
        if parsed_before:
            queryset = queryset.filter(occurred_at__lt=parsed_before)
        if parsed_after:
            queryset = queryset.filter(occurred_at__gte=parsed_after)

        try:
            events = queryset.order_by("-occurred_at", "-id")[:limit]
            payload = [
                {
                    "id": str(event.id),
                    "event_type": event.event_type,
                    "success": event.success,
                    "occurred_at": event.occurred_at.isoformat(),
                    "actor": {"user_id": str(event.actor_id), "email": event.actor.email} if event.actor else None,
                    "target": {"user_id": str(event.target_id), "email": event.target.email} if event.target else None,
                    "correlation_id": event.correlation_id,
                    "metadata": event.metadata,
                }
                for event in events
            ]
        except Exception:
            return _control_plane_internal_error(request)
        return JsonResponse({
            "events": payload,
            "limit": limit,
            "event_types": list(ControlPlaneAuditEventType.values),
        })


class ControlPlanePrincipalManagementView(View):
    """Owner-only endpoint for role and access management."""

    @staticmethod
    def _actor(request):
        user_id = request.session.get("control_plane_user_id")
        if not user_id:
            return None
        return (
            ControlPlanePrincipal.objects.select_related("user")
            .filter(user_id=user_id, enabled=True, deleted_at__isnull=True)
            .first()
        )

    def get(self, request):
        if not settings.DEBUG:
            return JsonResponse({"detail": "Control Plane is disabled outside DEBUG."}, status=404)
        actor = self._actor(request)
        if actor is None:
            return JsonResponse({"detail": "Control Center authentication is required."}, status=401)
        if actor.role != ControlPlaneRole.OWNER:
            return JsonResponse({"detail": "Owner permission is required."}, status=403)
        try:
            principals = ControlPlanePrincipal.objects.select_related("user").filter(deleted_at__isnull=True).order_by("user__email")
            payload = [
                {"user_id": str(p.user_id), "email": p.user.email, "role": p.role, "enabled": p.enabled,
                 "last_authenticated_at": p.last_authenticated_at.isoformat() if p.last_authenticated_at else None}
                for p in principals
            ]
        except Exception:
            return _control_plane_internal_error(request)
        return JsonResponse({
            "principals": payload,
            "roles": [{"value": value, "label": label} for value, label in ControlPlaneRole.choices],
        })

    @method_decorator(csrf_protect)
    def post(self, request):
        if not settings.DEBUG:
            return JsonResponse({"detail": "Control Plane is disabled outside DEBUG."}, status=404)
        actor = self._actor(request)
        if actor is None:
            return JsonResponse({"detail": "Control Center authentication is required."}, status=401)
        if actor.role != ControlPlaneRole.OWNER:
            return JsonResponse({"detail": "Owner permission is required."}, status=403)
        import json
        try:
            payload = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Request body must be valid JSON."}, status=400)
        if not isinstance(payload, dict):
            return JsonResponse({"detail": "Request body must be a JSON object."}, status=400)

        target_user_id = payload.get("user_id")
        role = payload.get("role")
        enabled = payload.get("enabled")
        if not isinstance(target_user_id, str) or not target_user_id.strip():
            return JsonResponse({"detail": "user_id is required."}, status=400)
        if role is not None and (not isinstance(role, str) or role not in ControlPlaneRole.values):
            return JsonResponse({"detail": "Invalid Control Center role."}, status=400)
        if enabled is not None and not isinstance(enabled, bool):
            return JsonResponse({"detail": "enabled must be a boolean."}, status=400)

        try:
            target = manage_control_plane_principal(
                actor=actor,
                target_user_id=target_user_id.strip(),
                role=role,
                enabled=enabled,
            )
        except ControlPlaneRoleManagementError as exc:
            return JsonResponse({"detail": str(exc)}, status=400)
        except Exception:
            return _control_plane_internal_error(request)
        try:
            response_payload = {
                "user_id": str(target.user_id),
                "email": target.user.email,
                "role": target.role,
                "enabled": target.enabled,
            }
        except Exception:
            return _control_plane_internal_error(request)
        return JsonResponse(response_payload)
