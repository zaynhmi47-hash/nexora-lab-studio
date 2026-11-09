from django.core.management.base import BaseCommand

from apps.dating_social_professional.date_reminder_worker import process_due_date_plan_reminders


class Command(BaseCommand):
    help = "Deliver due, durable Nexora Dating date-plan reminders."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=50)
        parser.add_argument("--max-attempts", type=int, default=5)

    def handle(self, *args, **options):
        processed = process_due_date_plan_reminders(
            limit=options["limit"],
            max_attempts=options["max_attempts"],
        )
        self.stdout.write(self.style.SUCCESS(f"Processed {processed} date reminder job(s)."))
