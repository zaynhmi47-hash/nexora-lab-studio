from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.identity.authentication import FirebaseIdentityAuthentication
from .services import QiblaService

class QiblaDirectionView(APIView):
    authentication_classes=[FirebaseIdentityAuthentication]
    permission_classes=[IsAuthenticated]
    def post(self,request):
        latitude=request.data.get("latitude"); longitude=request.data.get("longitude")
        try:
            latitude=float(latitude); longitude=float(longitude)
        except (TypeError,ValueError): return Response({"detail":"latitude and longitude must be numbers."},status=400)
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180: return Response({"detail":"Coordinates are outside valid ranges."},status=400)
        return Response(QiblaService.calculate(latitude,longitude))
