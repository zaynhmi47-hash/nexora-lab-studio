from django.urls import path

from .api import NexverseCatalogView, NexverseChapterContentView, NexverseWorkDetailView

urlpatterns = [
    path("works/", NexverseCatalogView.as_view(), name="nexverse-catalog"),
    path("works/<slug:work_slug>/", NexverseWorkDetailView.as_view(), name="nexverse-work-detail"),
    path(
        "works/<slug:work_slug>/chapters/<uuid:chapter_id>/",
        NexverseChapterContentView.as_view(),
        name="nexverse-chapter-content",
    ),
]
