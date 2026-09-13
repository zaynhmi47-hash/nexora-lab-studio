from django.urls import resolve
from rest_framework.test import APIRequestFactory

from api.v1.health import HealthView, LivenessView
from apps.core.api.response import error_response, success_response


def test_health_routes_resolve():
    assert resolve("/api/v1/health/").func.view_class is HealthView
    assert resolve("/api/v1/health/live/").func.view_class is LivenessView


def test_response_helpers_have_stable_envelope():
    success = success_response({"value": 1}, meta={"page": 1})
    assert success.status_code == 200
    assert success.data == {
        "success": True,
        "data": {"value": 1},
        "meta": {"page": 1},
        "error": None,
    }

    error = error_response("example.error", "Something failed", status=422)
    assert error.status_code == 422
    assert error.data["success"] is False
    assert error.data["error"] == {
        "code": "example.error",
        "message": "Something failed",
        "details": {},
    }


def test_liveness_view_is_public():
    request = APIRequestFactory().get("/api/v1/health/live/")
    response = LivenessView.as_view()(request)
    assert response.status_code == 200
    assert response.data == {"status": "ok"}
