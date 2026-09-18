from django.urls import path
from .api import CalendarEventsView
urlpatterns=[path("events/",CalendarEventsView.as_view())]
