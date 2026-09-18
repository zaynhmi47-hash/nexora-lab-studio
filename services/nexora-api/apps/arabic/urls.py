from django.urls import path

from .api import ArabicCompleteLessonView, ArabicPathsView, ArabicPracticeView, ArabicProgressView

urlpatterns = [
    path("paths/", ArabicPathsView.as_view(), name="arabic-paths"),
    path("progress/", ArabicProgressView.as_view(), name="arabic-progress"),
    path("lessons/<slug:lesson_key>/practice/", ArabicPracticeView.as_view(), name="arabic-practice"),
    path("lessons/<slug:lesson_key>/complete/", ArabicCompleteLessonView.as_view(), name="arabic-complete"),
]
