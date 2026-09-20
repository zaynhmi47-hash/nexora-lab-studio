from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser


class IdentitySessionView(APIView):
    """Return the internal NEXORA identity for a verified provider session."""

    authentication_classes = (FirebaseIdentityAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user: NexoraUser = request.user
        return Response(
            {
                "data": {
                    "id": str(user.id),
                    "displayName": user.display_name or None,
                    "email": user.email,
                    "photoUrl": user.avatar_url or None,
                }
            }
        )
