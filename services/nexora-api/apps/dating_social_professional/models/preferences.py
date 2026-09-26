from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingNotificationPreference(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="dating_notification_preferences")
    push_enabled = models.BooleanField(default=True)
    match_push_enabled = models.BooleanField(default=True)
    message_push_enabled = models.BooleanField(default=True)
    safety_push_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "dating_notification_preferences"


class DatingConversationPresence(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="dating_conversation_presence")
    conversation = models.ForeignKey(
        "DatingConversation",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="active_presence",
    )
    active = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_conversation_presence"
        indexes = [
            models.Index(fields=("conversation", "active")),
            models.Index(fields=("user", "active")),
        ]
