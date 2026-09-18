from datetime import date
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.identity.models import NexoraUser
from .services import PrayerService

class PrayerScheduleView(APIView):
    authentication_classes=[FirebaseIdentityAuthentication]
    permission_classes=[IsAuthenticated]
    def get(self,request):
        payload=PrayerService.get_daily_schedule(request.user,date.today())
        if payload is None: return Response({"detail":"Prayer schedule is not available."},status=404)
        return Response(payload)
    def put(self,request):
        name=request.data.get("name"); completed=request.data.get("completed")
        if not isinstance(name,str) or not isinstance(completed,bool): return Response({"detail":"name and completed are required."},status=400)
        try: payload=PrayerService.set_completed(request.user,date.today(),name,completed)
        except ValueError as exc: return Response({"detail":str(exc)},status=400)
        if payload is None: return Response({"detail":"Prayer schedule is not available."},status=404)
        return Response(payload)
