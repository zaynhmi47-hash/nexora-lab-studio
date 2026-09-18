from django.db import models
from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

class PrayerSchedule(AuditableBaseModel):
    date = models.DateField(unique=True)
    date_label = models.CharField(max_length=64)
    location_label = models.CharField(max_length=255, default="Current location")
    hijri_label = models.CharField(max_length=128, blank=True)
    sunrise = models.CharField(max_length=8)
    class Meta:
        db_table = "prayer_schedules"
        ordering = ("-date",)

class PrayerTime(AuditableBaseModel):
    class Name(models.TextChoices):
        FAJR="Fajr","Fajr"; DHUHR="Dhuhr","Dhuhr"; ASR="Asr","Asr"; MAGHRIB="Maghrib","Maghrib"; ISHA="Isha","Isha"
    schedule=models.ForeignKey(PrayerSchedule,on_delete=models.CASCADE,related_name="prayers")
    name=models.CharField(max_length=8,choices=Name.choices)
    time=models.CharField(max_length=8)
    sort_order=models.PositiveSmallIntegerField()
    class Meta:
        db_table="prayer_times"
        ordering=("sort_order",)
        constraints=[models.UniqueConstraint(fields=("schedule","name"),name="prayer_schedule_name_unique")]

class PrayerCompletion(AuditableBaseModel):
    user=models.ForeignKey(NexoraUser,on_delete=models.CASCADE,related_name="prayer_completions")
    prayer=models.ForeignKey(PrayerTime,on_delete=models.CASCADE,related_name="completions")
    completed=models.BooleanField(default=False)
    class Meta:
        db_table="prayer_completions"
        constraints=[models.UniqueConstraint(fields=("user","prayer"),name="prayer_user_time_unique")]
