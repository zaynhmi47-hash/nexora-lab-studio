from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingBlock(AuditableBaseModel):
    blocker = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_blocks_created")
    blocked = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_blocks_received")

    class Meta:
        db_table = "dating_blocks"
        constraints = [models.UniqueConstraint(fields=("blocker", "blocked"), name="dating_block_pair_unique")]


class DatingReport(AuditableBaseModel):
    class Reason(models.TextChoices):
        HARASSMENT = "harassment", "Harassment"
        SCAM = "scam", "Scam"
        IMPERSONATION = "impersonation", "Impersonation"
        INAPPROPRIATE = "inappropriate", "Inappropriate content"
        OTHER = "other", "Other"

    reporter = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_reports_created")
    reported = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_reports_received")
    reason = models.CharField(max_length=32, choices=Reason.choices)
    details = models.TextField(blank=True, max_length=2000)

    class Meta:
        db_table = "dating_reports"
        indexes = [models.Index(fields=("reported", "created_at"))]
