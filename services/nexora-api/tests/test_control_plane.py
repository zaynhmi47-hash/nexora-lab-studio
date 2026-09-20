import pytest
from django.test import Client


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
