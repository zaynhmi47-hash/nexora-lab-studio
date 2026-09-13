from django.urls import path

from apps.capabilities.api.views import CapabilityDetailView, CapabilityListView

urlpatterns = [
    path("", CapabilityListView.as_view(), name="capability-list"),
    path("<uuid:capability_id>/", CapabilityDetailView.as_view(), name="capability-detail"),
]
