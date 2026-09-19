from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import IslamicPlacesService

class IslamicPlacesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            latitude = float(request.query_params["lat"]) if "lat" in request.query_params else None
            longitude = float(request.query_params["lng"]) if "lng" in request.query_params else None
            radius_km = float(request.query_params.get("radiusKm", 25))
            place_type = request.query_params.get("type")
        except (TypeError, ValueError):
            return Response({"detail": "lat, lng, and radiusKm must be valid numbers."}, status=400)
        if radius_km <= 0 or radius_km > 100:
            return Response({"detail": "radiusKm must be between 0 and 100."}, status=400)
        if (latitude is None) != (longitude is None):
            return Response({"detail": "lat and lng must be provided together."}, status=400)
        if latitude is not None and not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return Response({"detail": "Coordinates are out of range."}, status=400)
        if place_type and place_type not in {"mosque", "musalla", "islamic_center"}:
            return Response({"detail": "type must be mosque, musalla, or islamic_center."}, status=400)
        return Response([
            {
                "id": str(place.id),
                "name": place.name,
                "type": place.place_type,
                "address": place.address,
                "city": place.city,
                "latitude": float(place.latitude),
                "longitude": float(place.longitude),
                "description": place.description,
                "distanceKm": round(distance, 2) if distance is not None else None,
            }
            for place, distance in IslamicPlacesService.list_places(latitude, longitude, radius_km, place_type)
        ])
