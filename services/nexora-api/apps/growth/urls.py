from django.urls import path

from .api import (
    GrowthGoalDetailView,
    GrowthGoalListView,
    GrowthJournalDetailView,
    GrowthJournalListView,
)
from .habit_api import GrowthHabitCheckInView, GrowthHabitDetailView, GrowthHabitListView
from .insights_api import GrowthInsightsView
from .timeline_api import GrowthTimelineView

urlpatterns = [
    path("insights/", GrowthInsightsView.as_view(), name="growth-insights"),
    path("timeline/", GrowthTimelineView.as_view(), name="growth-timeline"),
    path("goals/", GrowthGoalListView.as_view(), name="growth-goals"),
    path("goals/<uuid:goal_id>/", GrowthGoalDetailView.as_view(), name="growth-goal-detail"),
    path("journal/", GrowthJournalListView.as_view(), name="growth-journal"),
    path("journal/<uuid:entry_id>/", GrowthJournalDetailView.as_view(), name="growth-journal-detail"),
    path("habits/", GrowthHabitListView.as_view(), name="growth-habits"),
    path("habits/<uuid:habit_id>/", GrowthHabitDetailView.as_view(), name="growth-habit-detail"),
    path("habits/<uuid:habit_id>/check-ins/", GrowthHabitCheckInView.as_view(), name="growth-habit-check-in"),
]
