from django.urls import path

from .views import ControlPlaneDashboardView, ControlPlaneSnapshotView

app_name = "control_plane"

urlpatterns = [
    path("", ControlPlaneDashboardView.as_view(), name="dashboard"),
    path("snapshot/", ControlPlaneSnapshotView.as_view(), name="snapshot"),
]
