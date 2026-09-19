from django.urls import path

from .api import RamadanDashboardView

urlpatterns = [
    path("", RamadanDashboardView.as_view(), name="ramadan-dashboard"),
]
