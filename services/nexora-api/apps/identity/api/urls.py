from django.urls import path

from apps.identity.api.session import IdentitySessionView
from apps.identity.api.security import IdentityDeviceTrustView, IdentityDevicesView, IdentityLoginHistoryView, IdentitySessionRevocationView

urlpatterns = [
    path("session/", IdentitySessionView.as_view(), name="identity-session"),
    path("devices/", IdentityDevicesView.as_view(), name="identity-devices"),
    path("login-history/", IdentityLoginHistoryView.as_view(), name="identity-login-history"),
    path("devices/<uuid:device_id>/trust/", IdentityDeviceTrustView.as_view(), name="identity-device-trust"),
    path("devices/<uuid:device_id>/revoke/", IdentitySessionRevocationView.as_view(), name="identity-device-revoke"),
    path("sessions/revoke-all/", IdentitySessionRevocationView.as_view(), name="identity-sessions-revoke-all"),
]
