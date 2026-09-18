from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import CalendarService
def serialize(x): return {"id":str(x.id),"date":x.date.isoformat(),"hijriMonth":x.hijri_month,"hijriDay":x.hijri_day,"title":x.title,"description":x.description}
class CalendarEventsView(APIView):
 permission_classes=[AllowAny]
 def get(self,request): return Response([serialize(x) for x in CalendarService.events()])
