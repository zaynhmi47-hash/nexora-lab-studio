from django.urls import path

from .api import GamificationActivityView

urlpatterns = [
    path("activities/", GamificationActivityView.as_view(), name="gamification-activities"),
]
