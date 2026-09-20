from django.urls import path

from .operations import (
    ControlPlaneClearTelemetryView,
    ControlPlaneOperationsOverviewView,
    ControlPlaneSecurityOverviewView,
)
from .views import (
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
    path("audit/", ControlPlaneAuditLogView.as_view(), name="audit"),
    path("security/", ControlPlaneSecurityOverviewView.as_view(), name="security"),
    path("operations/", ControlPlaneOperationsOverviewView.as_view(), name="operations"),
    path("operations/telemetry/clear/", ControlPlaneClearTelemetryView.as_view(), name="operations-telemetry-clear"),
]
