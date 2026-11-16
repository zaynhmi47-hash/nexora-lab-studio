from django.urls import path

from apps.academic.api import AcademicOverviewView, AcademicResourceDetailView, AcademicResourceListCreateView
from apps.academic.enrollment_api import AcademicEnrollmentDetailView, AcademicEnrollmentListCreateView
from apps.academic.offering_api import AcademicCourseOfferingDetailView, AcademicCourseOfferingListCreateView
from apps.academic.study_plan_api import (
    AcademicStudyPlanDetailView,
    AcademicStudyPlanItemCreateView,
    AcademicStudyPlanItemDetailView,
    AcademicStudyPlanListCreateView,
    AcademicStudyPlanSubmitView,
)

urlpatterns = [
    path("overview/", AcademicOverviewView.as_view(), name="academic-overview"),
    path("classrooms/<uuid:classroom_id>/enrollments/", AcademicEnrollmentListCreateView.as_view(), name="academic-classroom-enrollments"),
    path("enrollments/<uuid:enrollment_id>/", AcademicEnrollmentDetailView.as_view(), name="academic-enrollment-detail"),
    path("offerings/", AcademicCourseOfferingListCreateView.as_view(), name="academic-offering-list"),
    path("offerings/<uuid:offering_id>/", AcademicCourseOfferingDetailView.as_view(), name="academic-offering-detail"),
    path("study-plans/", AcademicStudyPlanListCreateView.as_view(), name="academic-study-plan-list"),
    path("study-plans/<uuid:plan_id>/", AcademicStudyPlanDetailView.as_view(), name="academic-study-plan-detail"),
    path("study-plans/<uuid:plan_id>/items/", AcademicStudyPlanItemCreateView.as_view(), name="academic-study-plan-items"),
    path("study-plans/<uuid:plan_id>/items/<uuid:item_id>/", AcademicStudyPlanItemDetailView.as_view(), name="academic-study-plan-item-detail"),
    path("study-plans/<uuid:plan_id>/submit/", AcademicStudyPlanSubmitView.as_view(), name="academic-study-plan-submit"),
    path("<str:resource>/", AcademicResourceListCreateView.as_view(), name="academic-resource-list"),
    path("<str:resource>/<uuid:resource_id>/", AcademicResourceDetailView.as_view(), name="academic-resource-detail"),
]
