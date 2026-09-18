from django.urls import path
from .api import PrayerReminderPreferenceView
urlpatterns = [path("prayer/", PrayerReminderPreferenceView.as_view())]
