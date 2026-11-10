from django.urls import path

from .api import NexverseCatalogView, NexverseChapterContentView, NexverseWorkDetailView
from .moderation_api import (
    NexverseModerationDecisionView,
    NexverseModerationQueueView,
    NexverseModerationWorkDetailView,
)
from .reader_api import NexverseReadingProgressDetailView, NexverseReadingProgressListView
from .creator_api import (
    NexverseCreatorChapterDetailView,
    NexverseCreatorChapterListView,
    NexverseCreatorProfileView,
    NexverseCreatorWorkDetailView,
    NexverseCreatorWorkListView,
    NexverseSubmitWorkView,
)

urlpatterns = [
    path("works/", NexverseCatalogView.as_view(), name="nexverse-catalog"),
    path("reader/progress/", NexverseReadingProgressListView.as_view(), name="nexverse-reader-progress-list"),
    path("reader/progress/<uuid:work_id>/", NexverseReadingProgressDetailView.as_view(), name="nexverse-reader-progress-detail"),
    path("works/<slug:work_slug>/", NexverseWorkDetailView.as_view(), name="nexverse-work-detail"),
    path(
        "works/<slug:work_slug>/chapters/<uuid:chapter_id>/",
        NexverseChapterContentView.as_view(),
        name="nexverse-chapter-content",
    ),
    path("creator/profile/", NexverseCreatorProfileView.as_view(), name="nexverse-creator-profile"),
    path("creator/works/", NexverseCreatorWorkListView.as_view(), name="nexverse-creator-work-list"),
    path("creator/works/<uuid:work_id>/", NexverseCreatorWorkDetailView.as_view(), name="nexverse-creator-work-detail"),
    path("creator/works/<uuid:work_id>/chapters/", NexverseCreatorChapterListView.as_view(), name="nexverse-creator-chapter-list"),
    path("creator/works/<uuid:work_id>/chapters/<uuid:chapter_id>/", NexverseCreatorChapterDetailView.as_view(), name="nexverse-creator-chapter-detail"),
    path("creator/works/<uuid:work_id>/submit/", NexverseSubmitWorkView.as_view(), name="nexverse-creator-submit-work"),
    path("moderation/queue/", NexverseModerationQueueView.as_view(), name="nexverse-moderation-queue"),
    path("moderation/works/<uuid:work_id>/", NexverseModerationWorkDetailView.as_view(), name="nexverse-moderation-work-detail"),
    path("moderation/works/<uuid:work_id>/decision/", NexverseModerationDecisionView.as_view(), name="nexverse-moderation-decision"),
]
