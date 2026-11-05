from django.core.management.base import BaseCommand
from apps.dating_social_professional.worker import process_pending_media_jobs


class Command(BaseCommand):
    help = "Process queued Moment media jobs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=20)

    def handle(self, *args, **options):
        count = process_pending_media_jobs(limit=options["limit"])
        self.stdout.write(self.style.SUCCESS(f"Completed {count} media job(s)."))
