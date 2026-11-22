from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .insights import GrowthInsightsService


class GrowthInsightsView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw_window = request.query_params.get("window", "30")
        try:
            window_days = int(raw_window)
        except (TypeError, ValueError):
            return Response({"detail": "window must be 7 or 30."}, status=400)
        if window_days not in GrowthInsightsService.ALLOWED_WINDOWS:
            return Response({"detail": "window must be 7 or 30."}, status=400)
        return Response(
            GrowthInsightsService.build_snapshot(user=request.user, window_days=window_days)
        )
