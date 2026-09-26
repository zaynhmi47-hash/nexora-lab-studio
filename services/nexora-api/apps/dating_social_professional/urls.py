from django.urls import path

from .api import BlockView, ConversationBlockView, ConversationDetailView, ConversationMessagesView, ConversationReadView, ConversationReportView, ConversationView, DiscoveryView, MatchLifecycleView, MatchesView, MeProfileView, ReportView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
    path("matches/", MatchesView.as_view(), name="dating-matches"),
    path("matches/<uuid:match_id>/unmatch/", MatchLifecycleView.as_view(), name="dating-unmatch"),
    path("conversations/", ConversationView.as_view(), name="dating-conversation"),
    path("conversations/<uuid:conversation_id>/", ConversationDetailView.as_view(), name="dating-conversation-detail"),
    path("conversations/<uuid:conversation_id>/messages/", ConversationMessagesView.as_view(), name="dating-conversation-messages"),
    path("conversations/<uuid:conversation_id>/block/", ConversationBlockView.as_view(), name="dating-conversation-block"),
    path("conversations/<uuid:conversation_id>/report/", ConversationReportView.as_view(), name="dating-conversation-report"),
    path("conversations/<uuid:conversation_id>/read/", ConversationReadView.as_view(), name="dating-conversation-read"),
    path("blocks/", BlockView.as_view(), name="dating-block"),
    path("reports/", ReportView.as_view(), name="dating-report"),
]
