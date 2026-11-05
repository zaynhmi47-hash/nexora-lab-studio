from django.db import models
from django.utils import timezone

from apps.core.models import AuditableBaseModel
from .moments import DatingMoment


class DatingMomentMediaJob(AuditableBaseModel):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    moment = models.OneToOneField(
        DatingMoment,
        on_delete=models.CASCADE,
        related_name="media_processing_job",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED, db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    available_at = models.DateTimeField(default=timezone.now, db_index=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "dating_moment_media_jobs"
        indexes = [
            models.Index(fields=("status", "available_at"), name="dating_media_job_queue_idx"),
        ]

    def __str__(self):
        return f"Media processing for {self.moment_id} ({self.status})"
