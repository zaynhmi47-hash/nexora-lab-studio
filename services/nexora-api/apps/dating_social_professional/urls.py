from django.urls import path

from .api import ConversationPresenceView, NotificationPreferencesView, BlockView, ConversationBlockView, ConversationDetailView, ConversationMessagesView, ConversationReadView, ConversationReportView, ConversationView, DiscoveryView, MatchLifecycleView, ProfileDetailView, MatchesView, NotificationView, MeProfileView, ReportView, SwipeView

urlpatterns = [
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("profile/<uuid:profile_id>/", ProfileDetailView.as_view(), name="dating-profile-detail"),
    path("swipes/", SwipeView.as_view(), name="dating-swipe"),
    path("matches/", MatchesView.as_view(), name="dating-matches"),
    path("notifications/", NotificationView.as_view(), name="dating-notifications"),
    path("notification-preferences/", NotificationPreferencesView.as_view(), name="dating-notification-preferences"),
    path("push-tokens/", PushTokenView.as_view(), name="dating-push-tokens"),
    path("matches/<uuid:match_id>/unmatch/", MatchLifecycleView.as_view(), name="dating-unmatch"),
    path("conversations/", ConversationView.as_view(), name="dating-conversation"),
    path("conversations/<uuid:conversation_id>/", ConversationDetailView.as_view(), name="dating-conversation-detail"),
    path("conversations/<uuid:conversation_id>/messages/", ConversationMessagesView.as_view(), name="dating-conversation-messages"),
    path("conversations/<uuid:conversation_id>/block/", ConversationBlockView.as_view(), name="dating-conversation-block"),
    path("conversations/<uuid:conversation_id>/report/", ConversationReportView.as_view(), name="dating-conversation-report"),
    path("conversations/<uuid:conversation_id>/read/", ConversationReadView.as_view(), name="dating-conversation-read"),
    path("conversations/<uuid:conversation_id>/presence/", ConversationPresenceView.as_view(), name="dating-conversation-presence"),
    path("blocks/", BlockView.as_view(), name="dating-block"),
    path("reports/", ReportView.as_view(), name="dating-report"),
]
