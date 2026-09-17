from __future__ import annotations

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser
from apps.learning.services import LearningService


class CurrentAppStateView(APIView):
    """Return the authenticated user's platform bootstrap state."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: NexoraUser = request.user
        progress = LearningService.progress(user)
        completed_count = len(LearningService.completed_lesson_ids(user))
        return Response(
            {
                "userId": str(user.id),
                "learning": {
                    "xp": progress.xp,
                    "level": progress.level,
                    "currentStreak": progress.current_streak,
                    "completedLessons": completed_count,
                },
                "quran": {"readingPosition": None, "bookmarkCount": 0},
                "dhikr": {"totalCompleted": 0, "totalTargets": 0, "completedGoals": 0, "goalCount": 0},
                "umrah": {"overallProgress": 0, "currentStageId": "learn"},
                "profile": {"preferences": {"notificationsEnabled": True, "showArabicTransliteration": True}},
                "syncedAt": timezone.now().isoformat(),
            }
        )
