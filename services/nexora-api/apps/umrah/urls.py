from django.urls import path

from .api import UmrahChecklistToggleView, UmrahJourneyView

urlpatterns = [
    path("", UmrahJourneyView.as_view(), name="umrah-journey"),
    path("checklist/<slug:item_key>/toggle/", UmrahChecklistToggleView.as_view(), name="umrah-checklist-toggle"),
]
