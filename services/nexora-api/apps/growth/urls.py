from django.urls import path

from .api import (
    GrowthGoalDetailView,
    GrowthGoalListView,
    GrowthJournalDetailView,
    GrowthJournalListView,
)

urlpatterns = [
    path("goals/", GrowthGoalListView.as_view(), name="growth-goals"),
    path("goals/<uuid:goal_id>/", GrowthGoalDetailView.as_view(), name="growth-goal-detail"),
    path("journal/", GrowthJournalListView.as_view(), name="growth-journal"),
    path("journal/<uuid:entry_id>/", GrowthJournalDetailView.as_view(), name="growth-journal-detail"),
]
