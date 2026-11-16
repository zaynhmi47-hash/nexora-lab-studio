from django.urls import path

from apps.academic.api import AcademicOverviewView, AcademicResourceDetailView, AcademicResourceListCreateView

urlpatterns = [
    path("overview/", AcademicOverviewView.as_view(), name="academic-overview"),
    path("<str:resource>/", AcademicResourceListCreateView.as_view(), name="academic-resource-list"),
    path("<str:resource>/<uuid:resource_id>/", AcademicResourceDetailView.as_view(), name="academic-resource-detail"),
]
