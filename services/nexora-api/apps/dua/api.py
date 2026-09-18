from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import DuaService
def serialize(x): return {"id":str(x.id),"title":x.title,"category":x.category,"arabic":x.arabic,"transliteration":x.transliteration,"translation":x.translation,"reference":x.reference}
class DuaListView(APIView):
 permission_classes=[AllowAny]
 def get(self,request): return Response([serialize(x) for x in DuaService.list_entries(request.query_params.get("category"))])
