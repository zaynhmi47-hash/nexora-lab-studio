from django.db import transaction
from apps.identity.models import NexoraUser
from .models import PrayerCompletion, PrayerSchedule

class PrayerService:
    @staticmethod
    def get_daily_schedule(user: NexoraUser, schedule_date):
        schedule=PrayerSchedule.objects.prefetch_related("prayers").filter(date=schedule_date,deleted_at__isnull=True).first()
        if schedule is None: return None
        completions={x.prayer_id:x.completed for x in PrayerCompletion.objects.filter(user=user,prayer__schedule=schedule,deleted_at__isnull=True)}
        prayers=list(schedule.prayers.filter(deleted_at__isnull=True))
        return {"dateLabel":schedule.date_label,"locationLabel":schedule.location_label,"hijriLabel":schedule.hijri_label,"sunrise":schedule.sunrise,"prayers":[{"name":p.name,"time":p.time,"completed":completions.get(p.id,False),"isNext":False} for p in prayers]}

    @classmethod
    @transaction.atomic
    def set_completed(cls,user: NexoraUser,schedule_date,prayer_name:str,completed:bool):
        schedule=PrayerSchedule.objects.filter(date=schedule_date,deleted_at__isnull=True).first()
        if schedule is None: return None
        prayer=schedule.prayers.filter(name=prayer_name,deleted_at__isnull=True).first()
        if prayer is None: raise ValueError("Prayer not found.")
        row,_=PrayerCompletion.objects.select_for_update().get_or_create(user=user,prayer=prayer)
        row.completed=completed; row.deleted_at=None
        row.save(update_fields=["completed","deleted_at","updated_at"])
        return cls.get_daily_schedule(user,schedule_date)
