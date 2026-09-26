from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingPushToken(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="dating_push_tokens")
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=32)
    active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dating_push_tokens"
        indexes = [
            models.Index(fields=("user", "active")),
        ]
