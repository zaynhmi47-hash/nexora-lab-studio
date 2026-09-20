from __future__ import annotations

from collections import Counter
from time import monotonic

from django.conf import settings
from django.db import connection
from django.http import HttpResponseForbidden
from django.shortcuts import render
from django.urls import URLPattern, URLResolver, get_resolver
from django.views import View
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.views import APIView

from infrastructure.firebase.health import check_firebase_configuration

from .telemetry import recent_requests


def _route_inventory():
    routes: list[dict[str, str]] = []

    def walk(patterns, prefix=""):
        for item in patterns:
            route = prefix + str(item.pattern)
            if isinstance(item, URLPattern):
                routes.append({
                    "route": "/" + route.lstrip("/"),
                    "name": item.name or "",
                    "kind": "endpoint",
                })
            elif isinstance(item, URLResolver):
                walk(item.url_patterns, route)

    walk(get_resolver().url_patterns)
    return sorted(routes, key=lambda item: item["route"])


def _database_status() -> tuple[bool, str]:
    started = monotonic()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return True, f"{(monotonic() - started) * 1000:.1f} ms"
    except Exception as exc:
        return False, exc.__class__.__name__


def _snapshot():
    routes = _route_inventory()
    healthy_db, db_detail = _database_status()
    firebase_configured = check_firebase_configuration()

    prefix_counts = Counter(
        route["route"].split("/")[3] if len(route["route"].split("/")) > 3 else "root"
        for route in routes
        if route["route"].startswith("/api/")
    )

    return {
        "environment": "development",
        "debug": settings.DEBUG,
        "database": {"ok": healthy_db, "detail": db_detail},
        "firebase": {"configured": firebase_configured},
        "route_count": len(routes),
        "api_route_count": sum(prefix_counts.values()),
        "api_groups": [{"name": name, "routes": count} for name, count in sorted(prefix_counts.items())],
        "routes": routes,
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


@method_decorator(never_cache, name="dispatch")
class ControlPlaneDashboardView(View):
    def get(self, request):
        if not settings.DEBUG:
            return HttpResponseForbidden("Control Plane is available only in DEBUG mode.")
        return render(request, "control_plane/dashboard.html")


class ControlPlaneSnapshotView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not settings.DEBUG:
            return Response({"detail": "Control Plane is disabled outside DEBUG."}, status=404)
        return Response(_snapshot())
