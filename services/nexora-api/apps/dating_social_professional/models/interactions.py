from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

from .moments import DatingMoment


class DatingMomentReaction(AuditableBaseModel):
    moment = models.ForeignKey(DatingMoment, on_delete=models.PROTECT, related_name="reactions")
    user = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_moment_reactions")

    class Meta:
        db_table = "dating_moment_reactions"
        constraints = [
            models.UniqueConstraint(fields=("moment", "user"), condition=models.Q(deleted_at__isnull=True), name="dating_moment_reaction_active_unique"),
        ]
        indexes = [models.Index(fields=("moment", "created_at"), name="dating_moment_reaction_idx")]


class DatingMomentComment(AuditableBaseModel):
    moment = models.ForeignKey(DatingMoment, on_delete=models.PROTECT, related_name="comments")
    author = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_moment_comments")
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT, related_name="replies")
    body = models.TextField(max_length=2000)

    class Meta:
        db_table = "dating_moment_comments"
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=("moment", "created_at"), name="dating_moment_comment_idx"),
            models.Index(fields=("parent", "created_at"), name="dating_moment_reply_idx"),
        ]
