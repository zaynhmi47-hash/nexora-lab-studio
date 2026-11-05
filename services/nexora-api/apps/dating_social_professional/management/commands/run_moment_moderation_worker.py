from django.core.management.base import BaseCommand, CommandError

from apps.dating_social_professional.moderation_provider import ModerationProviderNotConfigured
from apps.dating_social_professional.moderation_worker import process_pending_moderation_jobs


class Command(BaseCommand):
    help = "Run configured AI risk assessment for queued Dating Moments."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=20)

    def handle(self, *args, **options):
        try:
            count = process_pending_moderation_jobs(limit=options["limit"])
        except ModerationProviderNotConfigured as exc:
            raise CommandError(f"{exc} AI moderation remains disabled; human review queue is still active.")
        self.stdout.write(self.style.SUCCESS(f"Assessed {count} Dating Moment(s). AI results are recommendations only."))
