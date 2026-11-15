from django.urls import path

from apps.academic.api import AcademicOverviewView

urlpatterns = [
    path("overview/", AcademicOverviewView.as_view(), name="academic-overview"),
]
