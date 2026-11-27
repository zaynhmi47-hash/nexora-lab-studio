from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.prayer.models import PrayerSchedule, PrayerTime


class Command(BaseCommand):
    help = "Seed the demo prayer schedule."

    def handle(self, *args, **options):
        schedule, _ = PrayerSchedule.objects.update_or_create(
            date=timezone.localdate(),
            defaults={
                "date_label": "Today",
                "location_label": "Current location",
                "hijri_label": "Hijri date will be provided by the prayer service",
                "sunrise": "05:58",
            },
        )
        rows = [
            ("Fajr", "05:01", 0),
            ("Dhuhr", "12:02", 1),
            ("Asr", "15:18", 2),
            ("Maghrib", "18:02", 3),
            ("Isha", "19:12", 4),
        ]
        for name, prayer_time, order in rows:
            PrayerTime.objects.update_or_create(
                schedule=schedule,
                name=name,
                defaults={"time": prayer_time, "sort_order": order},
            )
        self.stdout.write(self.style.SUCCESS("Seeded today's demo prayer schedule."))
