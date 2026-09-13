from __future__ import annotations

from typing import Any

from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from infrastructure.firebase.registry import FirebaseProviderRegistry
from apps.identity.services import IdentityService


class FirebaseIdentityAuthentication(BaseAuthentication):
    """Verify a Firebase bearer token, then resolve the internal NEXORA user."""

    keyword = b"bearer"

    def __init__(self, provider: Any = None):
        self.provider = provider

    def authenticate_header(self, request):
        return "Bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts:
            return None
        if len(parts) != 2 or parts[0].lower() != self.keyword:
            raise AuthenticationFailed("Invalid authorization header.")
        token = parts[1].decode("utf-8", errors="strict")
        provider = self.provider or FirebaseProviderRegistry().identity()
        try:
            user = IdentityService(provider).authenticate_token(token)
        except Exception as exc:
            raise AuthenticationFailed("Authentication credentials were not accepted.") from exc
        return user, None
