from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.identity.authentication import FirebaseIdentityAuthentication
from .services import HadithFavoriteService, KnowledgeService

class KnowledgeView(APIView):
    permission_classes = [AllowAny]
    def get(self, request): return Response(KnowledgeService.snapshot())

class KnowledgeTopicView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, key):
        payload = KnowledgeService.topic_detail(key)
        return Response(payload or {"detail": "Topic not found."}, status=200 if payload else 404)

class KnowledgeHadithView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, key):
        payload = KnowledgeService.hadith_detail(key)
        return Response(payload or {"detail": "Hadith not found."}, status=200 if payload else 404)

class HadithFavoriteListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [FirebaseIdentityAuthentication]

    def get(self, request):
        return Response([KnowledgeService._hadith(item.hadith) | {"favoriteId": str(item.id)} for item in HadithFavoriteService.list_favorites(request.user)])

class HadithFavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [FirebaseIdentityAuthentication]

    def post(self, request, hadith_id):
        favorite, active = HadithFavoriteService.toggle(request.user, hadith_id)
        if favorite is None:
            return Response({"detail": "Hadith not found."}, status=404)
        return Response({"hadithId": str(favorite.hadith_id), "favoriteId": str(favorite.id), "active": active})
