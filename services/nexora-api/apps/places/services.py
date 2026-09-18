from math import atan2, cos, radians, sin, sqrt
from .models import IslamicPlace

EARTH_RADIUS_KM = 6371.0

def _distance_km(lat1, lon1, lat2, lon2):
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * atan2(sqrt(a), sqrt(1 - a))

class IslamicPlacesService:
    @staticmethod
    def list_places(latitude=None, longitude=None, radius_km=25):
        places = IslamicPlace.objects.filter(is_published=True, deleted_at__isnull=True)
        rows = []
        for place in places:
            item = place
            distance = None
            if latitude is not None and longitude is not None:
                distance = _distance_km(float(latitude), float(longitude), float(place.latitude), float(place.longitude))
                if distance > radius_km:
                    continue
            rows.append((item, distance))
        if latitude is not None and longitude is not None:
            rows.sort(key=lambda row: row[1])
        return rows
