from django.urls import path

from .api import (
    ResearchContributionDetailView,
    ResearchContributionListView,
    ResearchEvidenceVerificationTransitionView,
    ResearchOrganizationVerificationQueueView,
    ResearchEvidenceVerificationView,
    ResearchOutputDetailView,
    ResearchOutputListView,
    ResearchProjectDetailView,
    ResearchProjectListView,
)

urlpatterns = [
    path("projects/", ResearchProjectListView.as_view(), name="research-projects"),
    path("organizations/<uuid:organization_id>/verifications/", ResearchOrganizationVerificationQueueView.as_view(), name="research-organization-verification-queue"),
    path("projects/<uuid:project_id>/", ResearchProjectDetailView.as_view(), name="research-project-detail"),
    path("projects/<uuid:project_id>/outputs/", ResearchOutputListView.as_view(), name="research-project-outputs"),
    path("projects/<uuid:project_id>/outputs/<uuid:output_id>/", ResearchOutputDetailView.as_view(), name="research-project-output-detail"),
    path("projects/<uuid:project_id>/outputs/<uuid:output_id>/verification/", ResearchEvidenceVerificationView.as_view(), name="research-output-verification"),
    path("projects/<uuid:project_id>/outputs/<uuid:output_id>/verification/<uuid:verification_id>/transition/", ResearchEvidenceVerificationTransitionView.as_view(), name="research-output-verification-transition"),
    path("projects/<uuid:project_id>/contributions/", ResearchContributionListView.as_view(), name="research-project-contributions"),
    path("projects/<uuid:project_id>/contributions/<uuid:contribution_id>/", ResearchContributionDetailView.as_view(), name="research-project-contribution-detail"),
]
