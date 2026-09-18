from django.urls import path
from .api import QiblaDirectionView
urlpatterns=[path("direction/",QiblaDirectionView.as_view(),name="qibla-direction")]
