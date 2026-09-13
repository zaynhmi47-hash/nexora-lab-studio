from rest_framework.response import Response
from rest_framework.views import APIView

from infrastructure.database import check_database_connection


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        checks = {"database": self._database_check()}
        healthy = all(checks.values())
        payload = {
            "status": "ok" if healthy else "degraded",
            "checks": checks,
            "request_id": getattr(request, "request_id", None),
        }
        return Response(payload, status=200 if healthy else 503)

    @staticmethod
    def _database_check() -> bool:
        return check_database_connection()


class LivenessView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class ReadinessView(HealthView):
    pass
