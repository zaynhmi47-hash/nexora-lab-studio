from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from infrastructure.common.types import ObjectReference
from infrastructure.moderation.ports import ContentModerationRequest

from .models import DatingMoment, DatingMomentModerationJob
from .moderation_provider import get_content_moderation_provider


def process_pending_moderation_jobs(*, limit=20, max_attempts=5):
    """Run AI assessments and persist recommendations without publishing or rejecting content."""
    limit = max(1, min(int(limit), 500))
    max_attempts = max(1, min(int(max_attempts), 20))
    provider = get_content_moderation_provider()
    completed = 0

    for _ in range(limit):
        with transaction.atomic():
            now = timezone.now()
            job = (
                DatingMomentModerationJob.objects.select_for_update(skip_locked=True)
                .select_related("moment")
                .filter(
                    Q(status=DatingMomentModerationJob.Status.QUEUED, available_at__lte=now)
                    | Q(status=DatingMomentModerationJob.Status.PROCESSING, locked_at__lt=now - timedelta(minutes=15)),
                    deleted_at__isnull=True,
                    moment__deleted_at__isnull=True,
                )
                .order_by("available_at", "created_at")
                .first()
            )
            if job is None:
                break
            job.status = DatingMomentModerationJob.Status.PROCESSING
            job.attempts += 1
            job.locked_at = now
            job.save(update_fields=["status", "attempts", "locked_at", "updated_at"])
            moment = job.moment

        media_reference = (
            ObjectReference(namespace="dating/moments", key=moment.storage_key)
            if moment.storage_key else None
        )
        thumbnail_reference = (
            ObjectReference(namespace="dating/moment-thumbnails", key=moment.thumbnail_key)
            if moment.thumbnail_key else None
        )
        request = ContentModerationRequest(
            content_id=str(moment.id),
            text=moment.caption,
            media_type=moment.media_type,
            media_reference=media_reference,
            thumbnail_reference=thumbnail_reference,
        )

        try:
            assessment = provider.assess(request)
            action = assessment.suggested_action
            if action not in {"approve", "reject", "review"}:
                action = "review"
            confidence = max(0.0, min(1.0, float(assessment.confidence)))
            categories = [str(value)[:80] for value in assessment.categories[:20]]
            job.provider_name = str(getattr(provider, "provider_name", provider.__class__.__name__))[:80]
            job.suggested_action = action
            job.confidence = confidence
            job.categories = categories
            job.explanation = str(assessment.explanation)[:500]
            job.status = DatingMomentModerationJob.Status.COMPLETED
            job.completed_at = timezone.now()
            job.last_error = ""
            job.locked_at = None
            job.save(update_fields=[
                "provider_name", "suggested_action", "confidence", "categories",
                "explanation", "status", "completed_at", "last_error", "locked_at", "updated_at",
            ])
            # Deliberately do not alter moment.moderation_status: a human reviewer decides.
            completed += 1
        except Exception as exc:
            job.refresh_from_db()
            job.locked_at = None
            job.last_error = str(exc)[:500]
            if job.attempts >= max_attempts:
                job.status = DatingMomentModerationJob.Status.FAILED
            else:
                job.status = DatingMomentModerationJob.Status.QUEUED
                job.available_at = timezone.now() + timedelta(seconds=min(3600, 30 * (2 ** (job.attempts - 1))))
            job.save(update_fields=["status", "locked_at", "last_error", "available_at", "updated_at"])

    return completed
