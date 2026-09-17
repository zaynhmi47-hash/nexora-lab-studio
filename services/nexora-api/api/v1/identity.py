from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser


class CurrentIdentityView(APIView):
    """Return the canonical NEXORA identity resolved from the Firebase bearer token."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: NexoraUser = request.user
        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "displayName": user.display_name,
                "avatarUrl": user.avatar_url or None,
                "phoneNumber": user.phone_number or None,
                "timezone": user.timezone,
                "locale": user.locale,
                "status": user.status,
            }
        )
