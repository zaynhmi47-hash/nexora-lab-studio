from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser

from .services import ProfileService


class ProfileView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: NexoraUser = request.user
        return Response(ProfileService.get_snapshot(user))

    def put(self, request):
        user: NexoraUser = request.user
        notifications = request.data.get("notificationsEnabled")
        transliteration = request.data.get("showArabicTransliteration")
        if not isinstance(notifications, bool) or not isinstance(transliteration, bool):
            return Response({"detail": "Both preference values must be booleans."}, status=400)
        return Response(ProfileService.update_preferences(
            user,
            notifications_enabled=notifications,
            show_arabic_transliteration=transliteration,
        ))
