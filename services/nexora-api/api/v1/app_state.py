from __future__ import annotations

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser


class CurrentAppStateView(APIView):
    """Return the authenticated user's platform bootstrap state.

    Domain-specific state remains behind its own repositories/services. This
    endpoint is intentionally a stable transport boundary for mobile clients.
    """

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: NexoraUser = request.user
        return Response(
            {
                "userId": str(user.id),
                "learning": {
                    "xp": 0,
                    "level": 1,
                    "currentStreak": 0,
                    "completedLessons": 0,
                },
                "quran": {
                    "readingPosition": None,
                    "bookmarkCount": 0,
                },
                "dhikr": {
                    "totalCompleted": 0,
                    "totalTargets": 0,
                    "completedGoals": 0,
                    "goalCount": 0,
                },
                "umrah": {
                    "overallProgress": 0,
                    "currentStageId": "learn",
                },
                "profile": {
                    "preferences": {
                        "notificationsEnabled": True,
                        "showArabicTransliteration": True,
                    },
                },
                "syncedAt": timezone.now().isoformat(),
            }
        )
