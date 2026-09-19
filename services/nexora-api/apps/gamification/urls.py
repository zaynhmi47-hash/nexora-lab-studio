from django.urls import path

from .api import GamificationActivityView, GamificationStatisticsView

urlpatterns = [
    path("activities/", GamificationActivityView.as_view(), name="gamification-activities"),
    path("statistics/", GamificationStatisticsView.as_view(), name="gamification-statistics"),
]
