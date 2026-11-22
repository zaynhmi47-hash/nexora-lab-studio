from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .insights import GrowthInsightsService, GrowthTimelineService


class GrowthTimelineView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            window_days = int(request.query_params.get("window", "30"))
            limit = int(request.query_params.get("limit", "50"))
            data = GrowthTimelineService.build_timeline(
                user=request.user,
                window_days=window_days,
                limit=limit,
            )
        except (TypeError, ValueError):
            return Response(
                {"detail": "window must be 7 or 30 and limit must be between 1 and 100."},
                status=400,
            )
        return Response(data)
