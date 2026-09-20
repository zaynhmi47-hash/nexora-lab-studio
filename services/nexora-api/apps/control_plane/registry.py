from __future__ import annotations

APPLICATION_REGISTRY = [
    {
        "id": "nexora-core", "name": "Nexora Core", "kind": "platform",
        "description": "Shared backend foundation and cross-application services.",
        "route_prefixes": ["/api/v1/identity/", "/api/v1/app-state/", "/api/v1/capabilities/"],
        "status": "active",
    },
    {
        "id": "nexora-muslim", "name": "Nexora Muslim", "kind": "application",
        "description": "Quran, learning, Tajwid, Arabic, Dhikr, Umrah and related services.",
        "route_prefixes": ["/api/v1/learning/", "/api/v1/quran/", "/api/v1/dhikr/", "/api/v1/umrah/", "/api/v1/knowledge/", "/api/v1/tajwid/", "/api/v1/arabic/", "/api/v1/fasting/", "/api/v1/dua/", "/api/v1/calendar/", "/api/v1/zakat/", "/api/v1/reminders/", "/api/v1/places/", "/api/v1/ramadan/"],
        "status": "active",
    },
    {
        "id": "dignity", "name": "Dignity", "kind": "application",
        "description": "Education and academic platform; backend domains can be attached incrementally.",
        "route_prefixes": ["/api/v1/learning/"],
        "status": "active",
    },
    {
        "id": "nexora-finance", "name": "Nexora Finance", "kind": "application",
        "description": "Organization-scoped transactions, budgets, goals and financial reporting.",
        "route_prefixes": ["/api/v1/organizations/"],
        "status": "active",
    },
]


def application_snapshot(routes: list[dict[str, str]]) -> list[dict]:
    result = []
    for app in APPLICATION_REGISTRY:
        matched = [r for r in routes if any(r["route"].startswith(prefix) for prefix in app["route_prefixes"])]
        result.append({**app, "route_count": len(matched), "routes": matched})
    return result
