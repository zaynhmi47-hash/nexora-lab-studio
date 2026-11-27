from types import SimpleNamespace

from rest_framework.test import APITestCase

from .services import QiblaService


class QiblaServiceTests(APITestCase):
    def test_kaaba_coordinates_return_zero_distance(self):
        result = QiblaService.calculate(21.422487, 39.826206)
        self.assertAlmostEqual(result["distanceKm"], 0.0, places=1)
        self.assertGreaterEqual(result["bearingDegrees"], 0)
        self.assertLess(result["bearingDegrees"], 360)

    def test_direction_endpoint_returns_bearing_and_distance(self):
        self.client.force_authenticate(user=SimpleNamespace(is_authenticated=True))

        response = self.client.post(
            "/api/v1/qibla/direction/",
            {"latitude": -5.1477, "longitude": 119.4327},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("bearingDegrees", response.data)
        self.assertIn("distanceKm", response.data)
        self.assertEqual(response.data["userCoordinates"]["latitude"], -5.1477)

    def test_direction_endpoint_rejects_out_of_range_coordinates(self):
        self.client.force_authenticate(user=SimpleNamespace(is_authenticated=True))

        response = self.client.post(
            "/api/v1/qibla/direction/",
            {"latitude": 91, "longitude": 0},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
