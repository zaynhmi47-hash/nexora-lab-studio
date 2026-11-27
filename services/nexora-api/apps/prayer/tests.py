from types import SimpleNamespace
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase


class PrayerScheduleApiTests(APITestCase):
    def setUp(self):
        self.user = SimpleNamespace(is_authenticated=True)
        self.client.force_authenticate(user=self.user)

    @patch("apps.prayer.api.PrayerService.get_daily_schedule")
    def test_get_returns_the_authenticated_users_schedule(self, get_schedule):
        payload = {
            "dateLabel": "Today",
            "locationLabel": "Makassar",
            "hijriLabel": "",
            "sunrise": "05:58",
            "prayers": [],
        }
        get_schedule.return_value = payload

        response = self.client.get("/api/v1/prayer/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, payload)
        get_schedule.assert_called_once_with(self.user, timezone.localdate())

    @patch("apps.prayer.api.PrayerService.set_completed")
    def test_put_updates_a_prayer_completion(self, set_completed):
        payload = {
            "dateLabel": "Today",
            "locationLabel": "Makassar",
            "hijriLabel": "",
            "sunrise": "05:58",
            "prayers": [],
        }
        set_completed.return_value = payload

        response = self.client.put(
            "/api/v1/prayer/",
            {"name": "Fajr", "completed": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        set_completed.assert_called_once_with(self.user, timezone.localdate(), "Fajr", True)

    def test_put_rejects_invalid_completion_payload(self):
        response = self.client.put(
            "/api/v1/prayer/",
            {"name": "Fajr", "completed": "yes"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
