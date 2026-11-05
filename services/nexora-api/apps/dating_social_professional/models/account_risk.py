from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingAccountRiskProfile(AuditableBaseModel):
    class Level(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    user = models.OneToOneField(
        NexoraUser, on_delete=models.CASCADE, related_name="dating_risk_profile"
    )
    score = models.PositiveSmallIntegerField(default=0)
    level = models.CharField(max_length=12, choices=Level.choices, default=Level.LOW, db_index=True)
    confirmed_report_count = models.PositiveIntegerField(default=0)
    received_block_count = models.PositiveIntegerField(default=0)
    signals = models.JSONField(default=dict, blank=True)
    calculated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_account_risk_profiles"
        indexes = [models.Index(fields=("level", "score"), name="dating_risk_level_score_idx")]


class DatingAccountSecurityEvent(AuditableBaseModel):
    class Type(models.TextChoices):
        RISK_RECALCULATED = "risk_recalculated", "Risk recalculated"
        WARNING_ISSUED = "warning_issued", "Warning issued"
        ACCOUNT_REVIEWED = "account_reviewed", "Account reviewed"
        STATUS_CHANGED = "status_changed", "Account status changed"

    actor = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, related_name="dating_security_actions",
        null=True, blank=True,
    )
    subject = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, related_name="dating_security_events"
    )
    event_type = models.CharField(max_length=32, choices=Type.choices)
    previous_value = models.CharField(max_length=32, blank=True)
    new_value = models.CharField(max_length=32, blank=True)
    reason = models.CharField(max_length=1000, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "dating_account_security_events"
        indexes = [models.Index(fields=("subject", "created_at"), name="dating_security_subject_idx")]
