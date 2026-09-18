from django.urls import path
from .api import KnowledgeHadithView, KnowledgeTopicView, KnowledgeView

urlpatterns = [path("", KnowledgeView.as_view()), path("topics/<slug:key>/", KnowledgeTopicView.as_view()), path("hadith/<slug:key>/", KnowledgeHadithView.as_view())]
