from django.urls import path

from apps.identity.api.session import IdentitySessionView

urlpatterns = [
    path("session/", IdentitySessionView.as_view(), name="identity-session"),
]
