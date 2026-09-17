from django.urls import path

from .api import DhikrHistoryView, DhikrIncrementView, DhikrListView, DhikrResetView

urlpatterns = [
    path("", DhikrListView.as_view(), name="dhikr-list"),
    path("history/", DhikrHistoryView.as_view(), name="dhikr-history"),
    path("<slug:dhikr_key>/increment/", DhikrIncrementView.as_view(), name="dhikr-increment"),
    path("<slug:dhikr_key>/reset/", DhikrResetView.as_view(), name="dhikr-reset"),
]
