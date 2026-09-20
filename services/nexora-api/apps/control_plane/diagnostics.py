from __future__ import annotations

from collections import Counter
from time import monotonic

from django.db import connection
from django.urls import URLPattern, URLResolver, get_resolver


def route_inventory() -> list[dict[str, object]]:
    """Return a read-only inventory of registered Django endpoints."""
    routes: list[dict[str, object]] = []

    def walk(patterns, prefix: str = "") -> None:
        for item in patterns:
            route = prefix + str(item.pattern)
            if isinstance(item, URLPattern):
                view = getattr(item, "callback", None)
                view_class = getattr(view, "view_class", None)
                permissions = getattr(view_class, "permission_classes", None)
                auth_classes = getattr(view_class, "authentication_classes", None)
                permission_names = [
                    f"{cls.__module__}.{cls.__name__}" for cls in permissions or []
                ]
                auth_names = [
                    f"{cls.__module__}.{cls.__name__}" for cls in auth_classes or []
                ]
                if any(
                    name.endswith("AllowAny") or name.endswith("PublicEndpointPermission")
                    for name in permission_names
                ):
                    access = "public"
                elif permission_names:
                    access = "authenticated"
                else:
                    access = "default"
                routes.append(
                    {
                        "route": "/" + route.lstrip("/"),
                        "name": item.name or "",
                        "kind": "endpoint",
                        "access": access,
                        "permissions": permission_names,
                        "authentication": auth_names,
                    }
                )
            elif isinstance(item, URLResolver):
                walk(item.url_patterns, route)

    walk(get_resolver().url_patterns)
    return sorted(routes, key=lambda item: str(item["route"]))


def database_status() -> tuple[bool, str]:
    """Run a minimal read-only database connectivity check."""
    started = monotonic()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return True, f"{(monotonic() - started) * 1000:.1f} ms"
    except Exception as exc:
        return False, exc.__class__.__name__


def api_route_counts(routes: list[dict[str, object]]) -> dict[str, object]:
    """Derive stable API route counts from an existing route inventory."""
    prefix_counts = Counter(
        str(route["route"]).split("/")[3]
        if len(str(route["route"]).split("/")) > 3
        else "root"
        for route in routes
        if str(route["route"]).startswith("/api/")
    )
    return {
        "route_count": len(routes),
        "api_route_count": sum(prefix_counts.values()),
        "api_groups": [
            {"name": name, "routes": count}
            for name, count in sorted(prefix_counts.items())
        ],
    }


def diagnostic_status(
    *,
    ok: bool,
    checked_at: str,
    latency_ms: float | None,
    details: dict[str, object] | None = None,
) -> dict[str, object]:
    """Build the shared structured diagnostic result contract."""
    status = "healthy" if ok else "unavailable"
    return {
        "status": status,
        "latency_ms": latency_ms,
        "checked_at": checked_at,
        "details": details or {},
    }
