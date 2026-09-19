from django.urls import path
from .api import HadithFavoriteListView, HadithFavoriteToggleView, KnowledgeHadithView, KnowledgeTopicView, KnowledgeView

urlpatterns = [
    path("", KnowledgeView.as_view()),
    path("topics/<slug:key>/", KnowledgeTopicView.as_view()),
    path("hadith/<slug:key>/", KnowledgeHadithView.as_view()),
    path("hadith-favorites/", HadithFavoriteListView.as_view()),
    path("hadith-favorites/<uuid:hadith_id>/toggle/", HadithFavoriteToggleView.as_view()),
]
