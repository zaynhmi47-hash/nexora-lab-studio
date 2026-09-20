from __future__ import annotations

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dhikr.models import Dhikr, DhikrProgress
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser
from apps.learning.services import LearningService
from apps.umrah.services import UmrahService
from apps.quran.services import QuranService


class CurrentAppStateView(APIView):
    """Return the authenticated user's platform bootstrap state."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: NexoraUser = request.user
        progress = LearningService.progress(user)
        completed_count = len(LearningService.completed_lesson_ids(user))
        umrah = UmrahService.get_journey(user)
        reading_position = QuranService().get_reading_position(user)
        bookmark_count = QuranService().list_bookmarks(user).count()
        dhikr_items = list(
            Dhikr.objects.filter(
                is_published=True,
                deleted_at__isnull=True,
            )
        )
        dhikr_progress = {
            item.dhikr_id: item.completed
            for item in DhikrProgress.objects.filter(
                user=user,
                dhikr__in=dhikr_items,
                deleted_at__isnull=True,
            )
        }
        total_completed = sum(
            dhikr_progress.get(item.id, 0)
            for item in dhikr_items
        )
        total_targets = sum(item.target for item in dhikr_items)
        completed_goals = sum(
            1
            for item in dhikr_items
            if dhikr_progress.get(item.id, 0) >= item.target
        )
        return Response(
            {
                "userId": str(user.id),
                "learning": {
                    "xp": progress.xp,
                    "level": progress.level,
                    "currentStreak": progress.current_streak,
                    "completedLessons": completed_count,
                },
                "quran": {
                    "readingPosition": (
                        None
                        if reading_position is None
                        else {
                            "surahNumber": reading_position.surah.number,
                            "ayahNumber": reading_position.ayah_number,
                            "updatedAt": reading_position.updated_at.isoformat(),
                        }
                    ),
                    "bookmarkCount": bookmark_count,
                },
                "dhikr": {
                    "totalCompleted": total_completed,
                    "totalTargets": total_targets,
                    "completedGoals": completed_goals,
                    "goalCount": len(dhikr_items),
                },
                "umrah": {
                    "overallProgress": umrah["overallProgress"],
                    "currentStageId": umrah["currentStageId"],
                },
                "profile": {
                    "preferences": {
                        "notificationsEnabled": True,
                        "showArabicTransliteration": True,
                    }
                },
                "syncedAt": timezone.now().isoformat(),
            }
        )
