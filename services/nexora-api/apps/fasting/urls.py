from django.urls import path
from .api import RecordsView, TodayView
urlpatterns=[path("",RecordsView.as_view()),path("today/toggle/",TodayView.as_view())]
