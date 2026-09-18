from django.db import models
from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

class PrayerReminderPreference(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="prayer_reminder_preference")
    enabled = models.BooleanField(default=False)
    before_minutes = models.PositiveSmallIntegerField(default=10)
    class Meta:
        db_table = "prayer_reminder_preferences"
