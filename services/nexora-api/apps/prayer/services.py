from datetime import datetime

from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import PrayerCompletion, PrayerSchedule


class PrayerService:
    @staticmethod
    def get_daily_schedule(user: NexoraUser, schedule_date):
        schedule = (
            PrayerSchedule.objects.prefetch_related("prayers")
            .filter(date=schedule_date, deleted_at__isnull=True)
            .first()
        )
        if schedule is None:
            return None

        completions = {
            item.prayer_id: item.completed
            for item in PrayerCompletion.objects.filter(
                user=user,
                prayer__schedule=schedule,
                deleted_at__isnull=True,
            )
        }
        prayers = list(schedule.prayers.filter(deleted_at__isnull=True))
        current_time = timezone.localtime().time()
        next_prayer_id = None

        for prayer in prayers:
            try:
                prayer_time = datetime.strptime(prayer.time, "%H:%M").time()
            except ValueError:
                continue
            if prayer_time >= current_time:
                next_prayer_id = prayer.id
                break

        return {
            "dateLabel": schedule.date_label,
            "locationLabel": schedule.location_label,
            "hijriLabel": schedule.hijri_label,
            "sunrise": schedule.sunrise,
            "prayers": [
                {
                    "name": prayer.name,
                    "time": prayer.time,
                    "completed": completions.get(prayer.id, False),
                    "isNext": prayer.id == next_prayer_id,
                }
                for prayer in prayers
            ],
        }

    @classmethod
    @transaction.atomic
    def set_completed(cls, user: NexoraUser, schedule_date, prayer_name: str, completed: bool):
        schedule = PrayerSchedule.objects.filter(date=schedule_date, deleted_at__isnull=True).first()
        if schedule is None:
            return None

        prayer = schedule.prayers.filter(name=prayer_name, deleted_at__isnull=True).first()
        if prayer is None:
            raise ValueError("Prayer not found.")

        row, _ = PrayerCompletion.objects.select_for_update().get_or_create(user=user, prayer=prayer)
        row.completed = completed
        row.deleted_at = None
        row.save(update_fields=["completed", "deleted_at", "updated_at"])
        return cls.get_daily_schedule(user, schedule_date)
