from django.urls import path

from .api import (
    ResearchContributionDetailView,
    ResearchContributionListView,
    ResearchOutputDetailView,
    ResearchOutputListView,
    ResearchProjectDetailView,
    ResearchProjectListView,
)

urlpatterns = [
    path("projects/", ResearchProjectListView.as_view(), name="research-projects"),
    path("projects/<uuid:project_id>/", ResearchProjectDetailView.as_view(), name="research-project-detail"),
    path("projects/<uuid:project_id>/outputs/", ResearchOutputListView.as_view(), name="research-project-outputs"),
    path("projects/<uuid:project_id>/outputs/<uuid:output_id>/", ResearchOutputDetailView.as_view(), name="research-project-output-detail"),
    path("projects/<uuid:project_id>/contributions/", ResearchContributionListView.as_view(), name="research-project-contributions"),
    path("projects/<uuid:project_id>/contributions/<uuid:contribution_id>/", ResearchContributionDetailView.as_view(), name="research-project-contribution-detail"),
]
