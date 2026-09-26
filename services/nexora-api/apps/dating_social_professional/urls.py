from django.urls import path

from .api import DiscoveryView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
]
