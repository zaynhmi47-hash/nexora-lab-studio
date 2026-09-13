from django.urls import path

from api.v1.organizations import OrganizationDetailView, OrganizationListView, OrganizationMembershipView

urlpatterns = [
    path("", OrganizationListView.as_view(), name="organization-list"),
    path("<uuid:organization_id>/", OrganizationDetailView.as_view(), name="organization-detail"),
    path("<uuid:organization_id>/membership/", OrganizationMembershipView.as_view(), name="organization-membership"),
]
