from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import Dhikr
from .services import DhikrService


def payload(dhikr, progress):
    return {
        "id": dhikr.key,
        "title": dhikr.title,
        "arabic": dhikr.arabic,
        "transliteration": dhikr.transliteration,
        "translation": dhikr.translation,
        "target": dhikr.target,
        "completed": progress.completed if progress else 0,
        "category": dhikr.category,
    }


class DhikrBaseView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]


class DhikrListView(DhikrBaseView):
    def get(self, request):
        items = list(DhikrService.get_all())
        progress = {item.dhikr_id: item for item in __import__("apps.dhikr.models", fromlist=["DhikrProgress"]).DhikrProgress.objects.filter(user=request.user, dhikr__in=items, deleted_at__isnull=True)}
        return Response([payload(item, progress.get(item.id)) for item in items])


class DhikrIncrementView(DhikrBaseView):
    def post(self, request, dhikr_key):
        try:
            progress = DhikrService.increment(request.user, dhikr_key)
        except Dhikr.DoesNotExist:
            return Response({"detail": "Dhikr not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(payload(progress.dhikr, progress))


class DhikrResetView(DhikrBaseView):
    def post(self, request, dhikr_key):
        try:
            progress = DhikrService.reset(request.user, dhikr_key)
        except Dhikr.DoesNotExist:
            return Response({"detail": "Dhikr not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(payload(progress.dhikr, progress))


class DhikrHistoryView(DhikrBaseView):
    def get(self, request):
        entries = DhikrService.history(request.user, request.query_params.get("dhikrId"))
        return Response([
            {"id": str(entry.id), "dhikrId": entry.dhikr.key, "count": entry.count, "completedAt": entry.completed_at.isoformat()}
            for entry in entries
        ])
