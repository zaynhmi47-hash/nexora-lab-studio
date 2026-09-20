import pytest
from django.test import Client

from apps.control_plane.models import ControlPlanePrincipal
from apps.identity.models import NexoraUser


def authenticated_control_center_client(settings):
    settings.DEBUG = True
    user = NexoraUser.objects.create(
        email="owner@example.com",
        display_name="Owner",
        status=NexoraUser.Status.ACTIVE,
    )
    ControlPlanePrincipal.objects.create(user=user, enabled=True)
    client = Client()
    session = client.session
    session["control_plane_user_id"] = str(user.id)
    session.save()
    return client


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
def test_control_plane_requires_identity(settings):
    settings.DEBUG = True
    client = Client()
    assert client.get("/ops/").status_code == 302
    assert client.get("/ops/snapshot/").status_code == 401
    assert client.get("/ops/login/").status_code == 200


@pytest.mark.django_db
def test_control_plane_dashboard_is_available_after_identity(settings):
    client = authenticated_control_center_client(settings)
    response = client.get("/ops/")
    assert response.status_code == 200
    assert b"Nexora Control Plane" in response.content


@pytest.mark.django_db
def test_control_plane_snapshot_reports_core_services(settings):
    client = authenticated_control_center_client(settings)
    response = client.get("/ops/snapshot/")
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
    client = authenticated_control_center_client(settings)
    response = client.get("/ops/snapshot/")
    assert response.status_code == 200
    payload = response.json()
    application_names = {item["name"] for item in payload["applications"]}
    assert {"Nexora Core", "Nexora Muslim", "Dignity", "Nexora Finance"} <= application_names
    health = next(route for route in payload["routes"] if route["route"] == "/api/v1/health/")
    assert health["access"] == "public"
    identity = next(route for route in payload["routes"] if route["route"] == "/api/v1/identity/me/")
    assert identity["access"] == "authenticated"


@pytest.mark.django_db
def test_disabled_control_plane_principal_cannot_access(settings):
    settings.DEBUG = True
    user = NexoraUser.objects.create(
        email="disabled@example.com",
        status=NexoraUser.Status.ACTIVE,
    )
    ControlPlanePrincipal.objects.create(user=user, enabled=False)
    client = Client()
    session = client.session
    session["control_plane_user_id"] = str(user.id)
    session.save()
    assert client.get("/ops/").status_code == 302
    assert client.get("/ops/snapshot/").status_code == 401
