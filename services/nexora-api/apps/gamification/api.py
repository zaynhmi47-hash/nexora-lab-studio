from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .services import GamificationService



class GamificationActivityView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 50))
        except (TypeError, ValueError):
            limit = 50
        activities = GamificationService.list_recent(request.user, limit=limit)
        return Response([
            {
                "id": str(activity.id),
                "source": activity.source,
                "action": activity.action,
                "sourceKey": activity.source_key,
                "xpEarned": activity.xp_earned,
                "occurredAt": activity.occurred_at.isoformat(),
            }
            for activity in activities
        ])


class GamificationStatisticsView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        return Response(GamificationService.statistics(request.user, days))

class GamificationDailyRewardView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        activity, claimed = GamificationService.claim_daily_reward(request.user)
        return Response({
            "id": str(activity.id),
            "claimed": claimed,
            "xpEarned": activity.xp_earned if claimed else 0,
            "awardedXp": activity.xp_earned,
            "occurredAt": activity.occurred_at.isoformat(),
        })

class GamificationSummaryView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.services import UnifiedLearningEngine
        return Response(UnifiedLearningEngine.snapshot(request.user))
