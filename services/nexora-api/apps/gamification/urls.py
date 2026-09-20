from django.urls import path

from .api import (
    GamificationActivityView,
    GamificationDailyRewardView,
    GamificationStatisticsView,
    GamificationSummaryView,
)

urlpatterns = [
    path("activities/", GamificationActivityView.as_view(), name="gamification-activities"),
    path("statistics/", GamificationStatisticsView.as_view(), name="gamification-statistics"),
    path("summary/", GamificationSummaryView.as_view(), name="gamification-summary"),
    path("daily-reward/", GamificationDailyRewardView.as_view(), name="gamification-daily-reward"),
]
