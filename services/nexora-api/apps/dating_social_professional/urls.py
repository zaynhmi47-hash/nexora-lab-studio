from django.urls import path

from .api import BlockView, ConversationView, DiscoveryView, MatchesView, MeProfileView, ReportView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
    path("matches/", MatchesView.as_view(), name="dating-matches"),
    path("conversations/", ConversationView.as_view(), name="dating-conversation"),
    path("blocks/", BlockView.as_view(), name="dating-block"),
    path("reports/", ReportView.as_view(), name="dating-report"),
]
