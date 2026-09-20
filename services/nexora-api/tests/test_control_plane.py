import pytest
from django.test import Client


@pytest.mark.django_db
def test_api_defaults_to_authenticated_firebase_identity(settings):
    settings.DEBUG = True
    from rest_framework.settings import api_settings
    assert "apps.identity.authentication.FirebaseIdentityAuthentication" in [
        cls.__module__ + "." + cls.__name__
        for cls in api_settings.DEFAULT_AUTHENTICATION_CLASSES
    ]
    assert api_settings.DEFAULT_PERMISSION_CLASSES[0].__name__ == "AuthenticatedNexoraUserPermission"


@pytest.mark.django_db
def test_health_remains_public(settings):
    settings.DEBUG = True
    response = Client().get("/api/v1/health/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_control_plane_dashboard_is_available_in_debug(settings):
    settings.DEBUG = True
    response = Client().get("/ops/")
    assert response.status_code == 200
    assert b"Nexora Control Plane" in response.content


@pytest.mark.django_db
def test_control_plane_snapshot_reports_core_services(settings):
    settings.DEBUG = True
    response = Client().get("/ops/snapshot/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["database"]["ok"] is True
    assert payload["route_count"] > 0
    names = {service["name"] for service in payload["services"]}
    assert {"Nexora API", "Identity", "Firebase", "Muslim", "Finance"} <= names


def test_control_plane_disabled_when_not_debug(settings):
    settings.DEBUG = False
    response = Client().get("/ops/")
    assert response.status_code == 403


@pytest.mark.django_db
def test_control_plane_snapshot_reports_applications_and_route_access(settings):
    settings.DEBUG = True
    response = Client().get("/ops/snapshot/")
    assert response.status_code == 200
    payload = response.json()
    application_names = {item["name"] for item in payload["applications"]}
    assert {"Nexora Core", "Nexora Muslim", "Dignity", "Nexora Finance"} <= application_names
    health = next(route for route in payload["routes"] if route["route"] == "/api/v1/health/")
    assert health["access"] == "public"
    identity = next(route for route in payload["routes"] if route["route"] == "/api/v1/identity/me/")
    assert identity["access"] == "authenticated"
