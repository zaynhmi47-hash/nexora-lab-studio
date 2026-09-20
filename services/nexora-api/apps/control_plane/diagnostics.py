from __future__ import annotations

from collections import Counter
from time import monotonic

from django.db import connection
from django.urls import URLPattern, URLResolver, get_resolver

from infrastructure.firebase.health import check_firebase_configuration


DIAGNOSTIC_STATUSES = frozenset({"healthy", "degraded", "unavailable"})


def _checked_at(value: str | None) -> str:
    if value is not None:
        return value
    from django.utils import timezone

    return timezone.now().isoformat()


def diagnostic_status(*, status: str, checked_at: str, latency_ms: float | None,
                      details: dict[str, object] | None = None) -> dict[str, object]:
    if status not in DIAGNOSTIC_STATUSES:
        raise ValueError(f"Unsupported diagnostic status: {status}")
    return {"status": status, "latency_ms": latency_ms, "checked_at": checked_at, "details": details or {}}


def route_inventory() -> list[dict[str, object]]:
    routes: list[dict[str, object]] = []

    def walk(patterns, prefix: str = "") -> None:
        for item in patterns:
            route = prefix + str(item.pattern)
            if isinstance(item, URLPattern):
                view = getattr(item, "callback", None)
                view_class = getattr(view, "view_class", None)
                permissions = getattr(view_class, "permission_classes", None)
                auth_classes = getattr(view_class, "authentication_classes", None)
                permission_names = [f"{cls.__module__}.{cls.__name__}" for cls in permissions or []]
                auth_names = [f"{cls.__module__}.{cls.__name__}" for cls in auth_classes or []]
                if any(name.endswith("AllowAny") or name.endswith("PublicEndpointPermission") for name in permission_names):
                    access = "public"
                elif permission_names:
                    access = "authenticated"
                else:
                    access = "default"
                routes.append({
                    "route": "/" + route.lstrip("/"),
                    "name": item.name or "",
                    "kind": "endpoint",
                    "access": access,
                    "permissions": permission_names,
                    "authentication": auth_names,
                })
            elif isinstance(item, URLResolver):
                walk(item.url_patterns, route)

    walk(get_resolver().url_patterns)
    return sorted(routes, key=lambda item: str(item["route"]))


def database_diagnostic(*, checked_at: str | None = None) -> dict[str, object]:
    """Run a read-only database check without exposing raw exception messages."""
    started = monotonic()
    timestamp = _checked_at(checked_at)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception as exc:
        return diagnostic_status(
            status="unavailable",
            checked_at=timestamp,
            latency_ms=(monotonic() - started) * 1000,
            details={"error_type": exc.__class__.__name__},
        )
    return diagnostic_status(
        status="healthy",
        checked_at=timestamp,
        latency_ms=(monotonic() - started) * 1000,
        details={"check": "SELECT 1"},
    )


def firebase_configuration_diagnostic(*, checked_at: str | None = None) -> dict[str, object]:
    """Report Firebase configuration only; intentionally performs no network health check."""
    timestamp = _checked_at(checked_at)
    try:
        configured = bool(check_firebase_configuration())
    except Exception as exc:
        return diagnostic_status(
            status="unavailable",
            checked_at=timestamp,
            latency_ms=None,
            details={"check": "configuration-only", "error_type": exc.__class__.__name__},
        )
    return diagnostic_status(
        status="healthy" if configured else "unavailable",
        checked_at=timestamp,
        latency_ms=None,
        details={"configured": configured, "check": "configuration-only"},
    )


def api_route_counts(routes: list[dict[str, object]]) -> dict[str, object]:
    """Group API routes by their first domain segment after /api/v1/."""
    prefix_counts = Counter()
    for route in routes:
        value = str(route["route"])
        if not value.startswith("/api/"):
            continue
        parts = [part for part in value.split("/") if part]
        group = (
            parts[2]
            if len(parts) > 2 and parts[1].startswith("v")
            else parts[1] if len(parts) > 1 else "root"
        )
        prefix_counts[group] += 1
    return {
        "route_count": len(routes),
        "api_route_count": sum(prefix_counts.values()),
        "api_groups": [
            {"name": name, "routes": count}
            for name, count in sorted(prefix_counts.items())
        ],
    }
def api_route_diagnostic(routes: list[dict[str, object]], *, checked_at: str | None = None) -> dict[str, object]:
    counts = api_route_counts(routes)
    return diagnostic_status(
        status="healthy" if counts["route_count"] else "unavailable",
        checked_at=_checked_at(checked_at),
        latency_ms=0.0,
        details=counts,
    )


def overall_operations_status(diagnostics: dict[str, dict[str, object]]) -> str:
    database = diagnostics["database"]["status"]
    firebase = diagnostics["firebase"]["status"]
    api = diagnostics["api"]["status"]
    if database == "unavailable":
        return "unavailable"
    if "unavailable" in {firebase, api} or "degraded" in {database, firebase, api}:
        return "degraded"
    return "healthy"
