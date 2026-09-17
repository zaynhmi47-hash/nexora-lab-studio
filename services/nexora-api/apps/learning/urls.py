from django.urls import path

from .api import (
    LearningCompleteLessonView,
    LearningCoursesView,
    LearningProgressView,
    LearningQuizView,
)

urlpatterns = [
    path("courses/", LearningCoursesView.as_view(), name="learning-courses"),
    path("progress/", LearningProgressView.as_view(), name="learning-progress"),
    path("lessons/<slug:lesson_key>/quiz/", LearningQuizView.as_view(), name="learning-quiz"),
    path("lessons/<slug:lesson_key>/complete/", LearningCompleteLessonView.as_view(), name="learning-complete"),
]
