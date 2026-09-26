from django.urls import path

from .api import BlockView, ConversationMessagesView, ConversationReadView, ConversationView, DiscoveryView, MatchesView, MeProfileView, ReportView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
    path("matches/", MatchesView.as_view(), name="dating-matches"),
    path("conversations/", ConversationView.as_view(), name="dating-conversation"),
    path("conversations/<uuid:conversation_id>/messages/", ConversationMessagesView.as_view(), name="dating-conversation-messages"),
    path("conversations/<uuid:conversation_id>/read/", ConversationReadView.as_view(), name="dating-conversation-read"),
    path("blocks/", BlockView.as_view(), name="dating-block"),
    path("reports/", ReportView.as_view(), name="dating-report"),
]
