from django.urls import path

from .api import (
    ResearchContributionListView,
    ResearchOutputListView,
    ResearchProjectDetailView,
    ResearchProjectListView,
)

urlpatterns = [
    path("projects/", ResearchProjectListView.as_view(), name="research-projects"),
    path("projects/<uuid:project_id>/", ResearchProjectDetailView.as_view(), name="research-project-detail"),
    path("projects/<uuid:project_id>/outputs/", ResearchOutputListView.as_view(), name="research-project-outputs"),
    path("projects/<uuid:project_id>/contributions/", ResearchContributionListView.as_view(), name="research-project-contributions"),
]
