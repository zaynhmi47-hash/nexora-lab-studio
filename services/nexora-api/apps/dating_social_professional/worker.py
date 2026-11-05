from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from infrastructure.firebase.registry import FirebaseProviderRegistry
from .media_processing import DatingMomentMediaProcessor
from .models import DatingMomentMediaJob


def process_pending_media_jobs(*, limit=20, max_attempts=5):
    """Process a bounded batch of durable thumbnail jobs; safe to call from a worker scheduler."""
    limit = max(1, min(int(limit), 500))
    max_attempts = max(1, min(int(max_attempts), 20))
    processor = DatingMomentMediaProcessor(FirebaseProviderRegistry().storage())
    completed = 0

    for _ in range(limit):
        with transaction.atomic():
            job = (
                DatingMomentMediaJob.objects.select_for_update(skip_locked=True)
                .filter(
                    Q(status=DatingMomentMediaJob.Status.QUEUED, available_at__lte=timezone.now())
                    | Q(status=DatingMomentMediaJob.Status.PROCESSING, locked_at__lt=timezone.now() - timedelta(minutes=15)),
                    deleted_at__isnull=True,
                )
                .order_by("available_at", "created_at")
                .first()
            )
            if job is None:
                break
            job.status = DatingMomentMediaJob.Status.PROCESSING
            job.attempts += 1
            job.locked_at = timezone.now()
            job.save(update_fields=["status", "attempts", "locked_at", "updated_at"])

        try:
            processor.process(job)
        except Exception as exc:
            job.refresh_from_db()
            job.locked_at = None
            job.last_error = str(exc)[:500]
            if job.attempts >= max_attempts:
                job.status = DatingMomentMediaJob.Status.FAILED
            else:
                job.status = DatingMomentMediaJob.Status.QUEUED
                job.available_at = timezone.now() + timedelta(seconds=min(3600, 30 * (2 ** (job.attempts - 1))))
            job.save(update_fields=["status", "locked_at", "last_error", "available_at", "updated_at"])
        else:
            job.status = DatingMomentMediaJob.Status.COMPLETED
            job.completed_at = timezone.now()
            job.locked_at = None
            job.last_error = ""
            job.save(update_fields=["status", "completed_at", "locked_at", "last_error", "updated_at"])
            completed += 1

    return completed
