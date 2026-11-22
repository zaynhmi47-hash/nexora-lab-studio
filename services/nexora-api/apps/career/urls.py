from django.urls import path

from .api import (
    CareerExperienceDetailView,
    CareerExperienceListView,
    CareerProjectDetailView,
    CareerProjectListView,
)

urlpatterns = [
    path("experiences/", CareerExperienceListView.as_view(), name="career-experiences"),
    path("experiences/<uuid:experience_id>/", CareerExperienceDetailView.as_view(), name="career-experience-detail"),
    path("projects/", CareerProjectListView.as_view(), name="career-projects"),
    path("projects/<uuid:project_id>/", CareerProjectDetailView.as_view(), name="career-project-detail"),
]
