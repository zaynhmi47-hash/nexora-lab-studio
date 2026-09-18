from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class ProfilePreference(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="profile_preference")
    notifications_enabled = models.BooleanField(default=True)
    show_arabic_transliteration = models.BooleanField(default=True)

    class Meta:
        db_table = "profile_preferences"
