import pytest
from django.test import Client

from apps.control_plane.models import ControlPlanePrincipal, ControlPlaneRole
from apps.identity.models import NexoraUser


def authenticated_control_center_client(settings, *, role="owner", email="owner@example.com"):
    settings.DEBUG = True
    user = NexoraUser.objects.create(
        email=email,
        display_name="Control Center User",
        status=NexoraUser.Status.ACTIVE,
    )
    ControlPlanePrincipal.objects.create(user=user, enabled=True, role=role)
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


@pytest.mark.django_db
def test_control_plane_endpoint_security_requires_authentication(settings):
    settings.DEBUG = True
    client = Client()
    for method, path in (
        ("get", "/ops/security/"),
        ("get", "/ops/operations/"),
        ("post", "/ops/operations/telemetry/clear/"),
        ("get", "/ops/audit/"),
        ("get", "/ops/principals/"),
    ):
        response = getattr(client, method)(path)
        assert response.status_code == 401, (method, path, response.status_code)


@pytest.mark.django_db
def test_control_plane_endpoint_security_enforces_role_boundaries(settings):
    cases = (
        (ControlPlaneRole.OWNER, {
            "/ops/security/": 200,
            "/ops/operations/": 200,
            "/ops/operations/telemetry/clear/": 200,
            "/ops/audit/": 200,
            "/ops/principals/": 200,
        }),
        (ControlPlaneRole.PLATFORM_ADMIN, {
            "/ops/security/": 403,
            "/ops/operations/": 200,
            "/ops/operations/telemetry/clear/": 200,
            "/ops/audit/": 403,
            "/ops/principals/": 403,
        }),
        (ControlPlaneRole.SECURITY_ADMIN, {
            "/ops/security/": 200,
            "/ops/operations/": 403,
            "/ops/operations/telemetry/clear/": 403,
            "/ops/audit/": 200,
            "/ops/principals/": 403,
        }),
        (ControlPlaneRole.AUDITOR, {
            "/ops/security/": 200,
            "/ops/operations/": 200,
            "/ops/operations/telemetry/clear/": 403,
            "/ops/audit/": 200,
            "/ops/principals/": 403,
        }),
    )
    for index, (role, expected) in enumerate(cases):
        client = authenticated_control_center_client(
            settings,
            role=role,
            email=f"{role}-{index}@example.com",
        )
        for path, status in expected.items():
            method = client.post if path.endswith("/clear/") else client.get
            response = method(path)
            assert response.status_code == status, (role, path, response.status_code)


@pytest.mark.django_db
def test_control_plane_endpoints_are_disabled_outside_debug(settings):
    settings.DEBUG = False
    client = Client()
    for method, path in (
        ("get", "/ops/security/"),
        ("get", "/ops/operations/"),
        ("post", "/ops/operations/telemetry/clear/"),
        ("get", "/ops/audit/"),
        ("get", "/ops/principals/"),
    ):
        response = getattr(client, method)(path)
        assert response.status_code == 404, (method, path, response.status_code)


@pytest.mark.django_db
def test_telemetry_clear_requires_csrf(settings):
    settings.DEBUG = True
    user = NexoraUser.objects.create(
        email="csrf-required@example.com",
        display_name="CSRF Required",
        status=NexoraUser.Status.ACTIVE,
    )
    ControlPlanePrincipal.objects.create(user=user, enabled=True, role=ControlPlaneRole.OWNER)
    client = Client(enforce_csrf_checks=True)
    session = client.session
    session["control_plane_user_id"] = str(user.id)
    session.save()

    client.get("/ops/")
    response = client.post("/ops/operations/telemetry/clear/")
    assert response.status_code == 403


@pytest.mark.django_db
def test_telemetry_clear_with_csrf_is_allowed_for_owner(settings):
    client = Client(enforce_csrf_checks=True)
    settings.DEBUG = True
    user = NexoraUser.objects.create(
        email="csrf-owner@example.com",
        display_name="CSRF Owner",
        status=NexoraUser.Status.ACTIVE,
    )
    ControlPlanePrincipal.objects.create(user=user, enabled=True, role=ControlPlaneRole.OWNER)
    session = client.session
    session["control_plane_user_id"] = str(user.id)
    session.save()

    page = client.get("/ops/")
    assert page.status_code == 200
    token = client.cookies["csrftoken"].value
    response = client.post(
        "/ops/operations/telemetry/clear/",
        HTTP_X_CSRFTOKEN=token,
    )
    assert response.status_code == 200
    assert response.json()["detail"] == "Request telemetry cleared."
