from django.urls import path

from .moments_api import DatingMomentView
from .moderation_api import DatingMomentModerationQueueView
from .trust_safety_api import TrustSafetyReportsView, DatingMomentAppealView, TrustSafetyAppealsView
from .interactions_api import DatingMomentCommentsView, DatingMomentReactionView, DatingMomentReportView
from .api import ConversationPresenceView, NotificationPreferencesView, PushTokenView, BlockView, ConversationBlockView, ConversationDetailView, ConversationMessagesView, ConversationReadView, ConversationReportView, ConversationView, DiscoveryView, MatchLifecycleView, ProfileDetailView, MatchesView, NotificationView, MeProfileView, ProfileMediaView, ReportView, SwipeView

urlpatterns = [
    path("moments/", DatingMomentView.as_view(), name="dating-moments"),
    path("moderation/moments/", DatingMomentModerationQueueView.as_view(), name="dating-moment-moderation-queue"),
    path("moderation/moments/<uuid:moment_id>/", DatingMomentModerationQueueView.as_view(), name="dating-moment-moderation-detail"),
    path("moderation/appeals/", TrustSafetyAppealsView.as_view(), name="dating-moderation-appeals"),
    path("moderation/appeals/<uuid:appeal_id>/", TrustSafetyAppealsView.as_view(), name="dating-moderation-appeal-detail"),
    path("moderation/reports/", TrustSafetyReportsView.as_view(), name="dating-trust-safety-reports"),
    path("moderation/reports/<uuid:report_id>/", TrustSafetyReportsView.as_view(), name="dating-trust-safety-report-detail"),
    path("moments/<uuid:moment_id>/appeal/", DatingMomentAppealView.as_view(), name="dating-moment-appeal"),
    path("my-appeals/", DatingMomentAppealView.as_view(), name="dating-my-appeals"),
    path("moments/<uuid:moment_id>/reactions/", DatingMomentReactionView.as_view(), name="dating-moment-reactions"),
    path("moments/<uuid:moment_id>/comments/", DatingMomentCommentsView.as_view(), name="dating-moment-comments"),
    path("moments/<uuid:moment_id>/report/", DatingMomentReportView.as_view(), name="dating-moment-report"),
    path("discovery/", DiscoveryView.as_view(), name="dating-discovery"),
    path("profile/me/", MeProfileView.as_view(), name="dating-profile-me"),
    path("profile/<uuid:profile_id>/", ProfileDetailView.as_view(), name="dating-profile-detail"),
    path("profile/<uuid:profile_id>/media/", ProfileMediaView.as_view(), name="dating-profile-media"),
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
