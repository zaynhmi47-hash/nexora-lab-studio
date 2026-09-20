from django.urls import path

from .api import GamificationActivityView, GamificationStatisticsView, GamificationDailyRewardView

urlpatterns = [
    path("activities/", GamificationActivityView.as_view(), name="gamification-activities"),
    path("statistics/", GamificationStatisticsView.as_view(), name="gamification-statistics"),
    path("daily-reward/", GamificationDailyRewardView.as_view(), name="gamification-daily-reward"),
]
