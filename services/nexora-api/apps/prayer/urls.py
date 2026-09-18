from django.urls import path
from .api import PrayerScheduleView
urlpatterns=[path("",PrayerScheduleView.as_view(),name="prayer-schedule")]
