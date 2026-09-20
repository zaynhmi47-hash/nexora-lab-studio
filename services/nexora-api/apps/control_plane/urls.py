from django.urls import path

from .views import (
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
]
