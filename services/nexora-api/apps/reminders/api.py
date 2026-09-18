from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.identity.authentication import FirebaseIdentityAuthentication
from .models import PrayerReminderPreference

class PrayerReminderPreferenceView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        item, _ = PrayerReminderPreference.objects.get_or_create(user=request.user)
        return Response({"enabled": item.enabled, "beforeMinutes": item.before_minutes})
    def put(self, request):
        enabled = request.data.get("enabled")
        before = request.data.get("beforeMinutes")
        if not isinstance(enabled, bool) or not isinstance(before, int) or isinstance(before, bool) or not 0 <= before <= 60:
            return Response({"detail": "Invalid reminder preference."}, status=400)
        item, _ = PrayerReminderPreference.objects.get_or_create(user=request.user)
        item.enabled, item.before_minutes = enabled, before
        item.save(update_fields=["enabled", "before_minutes", "updated_at"])
        return Response({"enabled": item.enabled, "beforeMinutes": item.before_minutes})
