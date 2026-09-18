from math import atan2, cos, degrees, radians, sin, sqrt

KAABA_LATITUDE = 21.422487
KAABA_LONGITUDE = 39.826206
EARTH_RADIUS_KM = 6371.0

class QiblaService:
    @staticmethod
    def calculate(latitude: float, longitude: float):
        lat1, lat2 = radians(latitude), radians(KAABA_LATITUDE)
        delta_lon = radians(KAABA_LONGITUDE - longitude)
        bearing = (degrees(atan2(sin(delta_lon) * cos(lat2), cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(delta_lon))) + 360) % 360
        dlat = radians(KAABA_LATITUDE - latitude)
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
        distance = 2 * EARTH_RADIUS_KM * atan2(sqrt(a), sqrt(max(0.0, 1 - a)))
        return {"bearingDegrees": round(bearing, 2), "distanceKm": round(distance, 1), "locationLabel": "Device location", "sourceLabel": "Nexora Core calculation", "calibrated": False, "userCoordinates": {"latitude": latitude, "longitude": longitude}, "kaabaCoordinates": {"latitude": KAABA_LATITUDE, "longitude": KAABA_LONGITUDE}}
