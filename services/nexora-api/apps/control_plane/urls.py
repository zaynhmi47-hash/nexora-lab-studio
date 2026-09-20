from django.urls import path

from .operations import (\n    ControlPlaneClearTelemetryView,\n    ControlPlaneOperationsOverviewView,\n    ControlPlaneSecurityOverviewView,\n)\nfrom .views import (
    ControlPlaneAuditLogView,
    ControlPlaneDashboardView,
    ControlPlaneLoginView,
    ControlPlanePrincipalManagementView,
    ControlPlaneLogoutView,
    ControlPlaneSnapshotView,
)

app_name = "control_plane"

urlpatterns = [
    path("", ControlPlaneDashboardView.as_view(), name="dashboard"),
    path("login/", ControlPlaneLoginView.as_view(), name="login"),
    path("logout/", ControlPlaneLogoutView.as_view(), name="logout"),
    path("snapshot/", ControlPlaneSnapshotView.as_view(), name="snapshot"),
    path("principals/", ControlPlanePrincipalManagementView.as_view(), name="principals"),
    path("audit/", ControlPlaneAuditLogView.as_view(), name="audit"),\n    path("security/", ControlPlaneSecurityOverviewView.as_view(), name="security"),\n    path("operations/", ControlPlaneOperationsOverviewView.as_view(), name="operations"),\n    path("operations/telemetry/clear/", ControlPlaneClearTelemetryView.as_view(), name="operations-telemetry-clear"),
]
