from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser
from .match import DatingMatch


class DatingConversation(AuditableBaseModel):
    match = models.OneToOneField(DatingMatch, on_delete=models.PROTECT, related_name="conversation")
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "dating_conversations"


class DatingMessage(AuditableBaseModel):
    conversation = models.ForeignKey(DatingConversation, on_delete=models.PROTECT, related_name="messages")
    sender = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_messages")
    body = models.TextField(max_length=5000)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_messages"
        indexes = [models.Index(fields=("conversation", "created_at")), models.Index(fields=("conversation", "read_at"))]
