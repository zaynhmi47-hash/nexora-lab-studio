from django.db import models
from django.utils import timezone

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser
from .moments import DatingMoment


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

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        INVESTIGATING = "investigating", "Investigating"
        ACTION_TAKEN = "action_taken", "Action taken"
        DISMISSED = "dismissed", "Dismissed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    reporter = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_reports_created")
    reported = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_reports_received")
    reason = models.CharField(max_length=32, choices=Reason.choices)
    details = models.TextField(blank=True, max_length=2000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    priority = models.CharField(max_length=12, choices=Priority.choices, default=Priority.NORMAL, db_index=True)
    assigned_to = models.ForeignKey(NexoraUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="dating_reports_assigned")
    resolution = models.CharField(max_length=1000, blank=True)
    reviewed_by = models.ForeignKey(NexoraUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="dating_reports_reviewed")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_reports"
        indexes = [
            models.Index(fields=("reported", "created_at")),
            models.Index(fields=("status", "priority", "created_at"), name="dating_report_queue_idx"),
        ]


class DatingModerationAppeal(AuditableBaseModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    moment = models.OneToOneField(DatingMoment, on_delete=models.CASCADE, related_name="appeal")
    appellant = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_moderation_appeals")
    message = models.TextField(max_length=2000)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN, db_index=True)
    reviewer = models.ForeignKey(NexoraUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="dating_appeals_reviewed")
    reviewer_note = models.CharField(max_length=1000, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_moderation_appeals"
        indexes = [models.Index(fields=("status", "created_at"), name="dating_appeal_queue_idx")]


class DatingSafetyAuditEvent(AuditableBaseModel):
    actor = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_safety_events")
    report = models.ForeignKey(DatingReport, on_delete=models.PROTECT, null=True, blank=True, related_name="audit_events")
    appeal = models.ForeignKey(DatingModerationAppeal, on_delete=models.PROTECT, null=True, blank=True, related_name="audit_events")
    moment = models.ForeignKey(DatingMoment, on_delete=models.PROTECT, null=True, blank=True, related_name="safety_audit_events")
    action = models.CharField(max_length=48)
    previous_state = models.CharField(max_length=32, blank=True)
    new_state = models.CharField(max_length=32, blank=True)
    note = models.CharField(max_length=1000, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "dating_safety_audit_events"
        indexes = [models.Index(fields=("created_at", "action"), name="dating_safety_audit_idx")]
