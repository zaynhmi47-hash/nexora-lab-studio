from django.urls import path

from .api import (
    TajwidAssessmentView,
    TajwidCompletePracticeView,
    TajwidCompleteTopicView,
    TajwidPracticeView,
    TajwidProgressView,
    TajwidTopicsView,
)

urlpatterns = [
    path("topics/", TajwidTopicsView.as_view()),
    path("progress/", TajwidProgressView.as_view()),
    path("topics/<slug:topic_key>/practice/", TajwidPracticeView.as_view()),
    path("practice/<slug:practice_key>/complete/", TajwidCompletePracticeView.as_view()),
    path("topics/<slug:topic_key>/complete/", TajwidCompleteTopicView.as_view()),
    path("assessment/complete/", TajwidAssessmentView.as_view()),
]
