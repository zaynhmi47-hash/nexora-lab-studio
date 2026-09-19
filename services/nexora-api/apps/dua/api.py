from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import DuaService
from apps.identity.authentication import FirebaseIdentityAuthentication
def serialize(x): return {"id":str(x.id),"title":x.title,"category":x.category,"arabic":x.arabic,"transliteration":x.transliteration,"translation":x.translation,"reference":x.reference}
class DuaListView(APIView):
 permission_classes=[AllowAny]
 def get(self,request): return Response([serialize(x) for x in DuaService.list_entries(request.query_params.get("category"))])


from .services import DuaFavoriteService

class DuaFavoriteListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [FirebaseIdentityAuthentication]

    def get(self, request):
        return Response([serialize(item.dua) | {"favoriteId": str(item.id)} for item in DuaFavoriteService.list_favorites(request.user)])

class DuaFavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [FirebaseIdentityAuthentication]

    def post(self, request, dua_id):
        try:
            favorite, active = DuaFavoriteService.toggle(request.user, dua_id)
        except Exception:
            return Response({"detail": "Dua not found."}, status=404)
        return Response({"duaId": str(favorite.dua_id), "favoriteId": str(favorite.id), "active": active})
