from django.db import models
from django.utils import timezone

from apps.core.models import AuditableBaseModel
from .moments import DatingMoment


class DatingMomentModerationJob(AuditableBaseModel):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    class SuggestedAction(models.TextChoices):
        APPROVE = "approve", "Suggested approve"
        REJECT = "reject", "Suggested reject"
        REVIEW = "review", "Human review required"

    moment = models.OneToOneField(
        DatingMoment, on_delete=models.CASCADE, related_name="ai_moderation_job"
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED, db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    available_at = models.DateTimeField(default=timezone.now, db_index=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    provider_name = models.CharField(max_length=80, blank=True)
    suggested_action = models.CharField(max_length=16, choices=SuggestedAction.choices, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    categories = models.JSONField(default=list, blank=True)
    explanation = models.CharField(max_length=500, blank=True)
    last_error = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "dating_moment_moderation_jobs"
        indexes = [
            models.Index(fields=("status", "available_at"), name="dating_moderation_queue_idx"),
        ]

    def __str__(self):
        return f"AI moderation for {self.moment_id} ({self.status})"
