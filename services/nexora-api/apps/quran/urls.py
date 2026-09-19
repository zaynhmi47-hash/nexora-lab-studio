from django.urls import path

from .api import (
    QuranBookmarkDetailView,
    QuranBookmarkListView,
    QuranReadingPositionView,
    QuranRecitationListView,
    QuranReadingGoalView, QuranReadingLogView, QuranReadingStatisticsView,
    QuranSurahDetailView,
    QuranSurahListView,
)

urlpatterns = [
    path("surahs/", QuranSurahListView.as_view(), name="quran-surahs"),
    path("surahs/<int:number>/", QuranSurahDetailView.as_view(), name="quran-surah-detail"),
    path("reading-position/", QuranReadingPositionView.as_view(), name="quran-reading-position"),
    path("bookmarks/", QuranBookmarkListView.as_view(), name="quran-bookmarks"),
    path("bookmarks/<uuid:bookmark_id>/", QuranBookmarkDetailView.as_view(), name="quran-bookmark-detail"),
    path("recitations/", QuranRecitationListView.as_view(), name="quran-recitations"),
    path("goals/", QuranReadingGoalView.as_view(), name="quran-reading-goal"),
    path("statistics/", QuranReadingStatisticsView.as_view(), name="quran-reading-statistics"),
    path("reading-log/", QuranReadingLogView.as_view(), name="quran-reading-log"),
]
