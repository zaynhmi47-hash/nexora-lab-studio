from django.urls import path

from .api import DiscoveryView, MatchesView, MeProfileView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
    path("matches/", MatchesView.as_view(), name="dating-matches"),
]
