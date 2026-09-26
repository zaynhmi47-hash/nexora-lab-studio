from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingNotification(AuditableBaseModel):
    class Type(models.TextChoices):
        MATCH = "match", "Match"
        MESSAGE = "message", "Message"
        SAFETY = "safety", "Safety"

    recipient = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_notifications")
    type = models.CharField(max_length=32, choices=Type.choices)
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=500)
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_notifications"
        indexes = [
            models.Index(fields=("recipient", "read_at", "created_at")),
            models.Index(fields=("recipient", "created_at")),
        ]
