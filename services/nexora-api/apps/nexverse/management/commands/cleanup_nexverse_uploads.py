from __future__ import annotations

import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.nexverse.assets import NexverseUploadSession
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Expire stale Nexverse upload sessions and remove their private Storage objects."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report candidates without changing database or Storage.")
        parser.add_argument("--limit", type=int, default=100, help="Maximum number of sessions to inspect (default: 100).")
        parser.add_argument("--grace-hours", type=int, default=1, help="Wait this long after expiry/cancellation before deleting objects.")

    def handle(self, *args, **options):
        limit = options["limit"]
        grace_hours = options["grace_hours"]
        if limit < 1 or grace_hours < 0:
            self.stderr.write(self.style.ERROR("--limit must be positive and --grace-hours cannot be negative."))
            return

        now = timezone.now()
        cutoff = now - timedelta(hours=grace_hours)
        stale_created = NexverseUploadSession.objects.filter(
            status=NexverseUploadSession.Status.CREATED,
            expires_at__lte=cutoff,
            deleted_at__isnull=True,
        )
        if options["dry_run"]:
            self.stdout.write(f"Would expire {stale_created.count()} stale sessions.")
        else:
            stale_created.update(
                status=NexverseUploadSession.Status.EXPIRED,
                updated_at=now,
            )

        candidates = NexverseUploadSession.objects.filter(
            status=NexverseUploadSession.Status.EXPIRED,
            updated_at__lte=cutoff,
            deleted_at__isnull=True,
        ).order_by("updated_at")[:limit]

        deleted = 0
        failed = 0
        for session in candidates:
            reference = ObjectReference(
                namespace="nexverse",
                key=session.storage_path.removeprefix("nexverse/"),
            )
            if options["dry_run"]:
                self.stdout.write(f"Would delete expired upload object for session {session.pk}.")
                continue
            try:
                storage = FirebaseProviderRegistry().storage()
                if storage.exists(reference):
                    storage.delete(reference)
                deleted += 1
            except Exception:
                failed += 1
                logger.exception("Nexverse expired upload cleanup failed for session %s", session.pk)

        self.stdout.write(
            self.style.SUCCESS(
                f"Expired stale sessions; deleted {deleted} Storage objects; failures {failed}; "
                f"dry_run={options['dry_run']}."
            )
        )
