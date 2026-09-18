from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.identity.authentication import FirebaseIdentityAuthentication
from .models import FastingRecord
from .services import FastingService

def serialize(r): return {"id":str(r.id),"date":r.date.isoformat(),"status":r.status,"note":r.note}
class Base(APIView):
    authentication_classes=[FirebaseIdentityAuthentication]
    permission_classes=[IsAuthenticated]
class RecordsView(Base):
    def get(self,request): return Response({"summary":FastingService.summary(request.user),"records":[serialize(x) for x in FastingService.list_records(request.user)]})
class TodayView(Base):
    def post(self,request): return Response(serialize(FastingService.toggle_today(request.user)))
