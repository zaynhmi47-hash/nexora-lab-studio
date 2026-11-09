from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingDatePlan, DatingDatePlanReminder
from .notifications.service import DatingNotificationService


def process_due_date_plan_reminders(*, limit=50, max_attempts=5):
    """Deliver due in-app reminders once; safe for concurrent Postgres workers."""
    limit = max(1, min(int(limit), 500))
    max_attempts = max(1, min(int(max_attempts), 20))
    processed = 0

    for _ in range(limit):
        now = timezone.now()
        with transaction.atomic():
            reminder = (
                DatingDatePlanReminder.objects.select_for_update(skip_locked=True)
                .select_related("date_plan__match", "recipient")
                .filter(
                    Q(status=DatingDatePlanReminder.Status.PENDING, available_at__lte=now)
                    | Q(status=DatingDatePlanReminder.Status.PROCESSING, locked_at__lt=now - timedelta(minutes=5)),
                    deleted_at__isnull=True,
                )
                .order_by("available_at", "created_at")
                .first()
            )
            if reminder is None:
                break

            reminder.status = DatingDatePlanReminder.Status.PROCESSING
            reminder.locked_at = now
            reminder.attempts += 1
            reminder.save(update_fields=("status", "locked_at", "attempts", "updated_at"))

            plan = reminder.date_plan
            match = plan.match
            participants = {match.user_a_id, match.user_b_id}
            blocked = DatingBlock.objects.filter(
                Q(blocker_id=match.user_a_id, blocked_id=match.user_b_id)
                | Q(blocker_id=match.user_b_id, blocked_id=match.user_a_id)
            ).exists()
            valid = (
                plan.status == DatingDatePlan.Status.ACCEPTED
                and plan.reminder_version == reminder.schedule_version
                and plan.starts_at > now
                and match.active
                and reminder.recipient_id in participants
                and reminder.recipient.status == NexoraUser.Status.ACTIVE
                and not blocked
            )
            if not valid:
                reminder.status = DatingDatePlanReminder.Status.CANCELLED
                reminder.locked_at = None
                reminder.save(update_fields=("status", "locked_at", "updated_at"))
                processed += 1
                continue

            try:
                lead_label = "in 24 hours" if reminder.reminder_type == DatingDatePlanReminder.ReminderType.ONE_DAY else "in 1 hour"
                DatingNotificationService.create_and_dispatch(
                    recipient_id=reminder.recipient_id,
                    notification_type="date_plan",
                    title="Upcoming date",
                    body=f"Your date plan, {plan.title}, starts {lead_label}.",
                    data={
                        "event": "date_plan_reminder",
                        "date_plan_id": str(plan.id),
                        "reminder_type": reminder.reminder_type,
                        "starts_at": plan.starts_at.isoformat(),
                    },
                )
                reminder.status = DatingDatePlanReminder.Status.SENT
                reminder.sent_at = now
                reminder.last_error = ""
            except Exception as exc:
                reminder.last_error = str(exc)[:500]
                if reminder.attempts >= max_attempts:
                    reminder.status = DatingDatePlanReminder.Status.FAILED
                else:
                    reminder.status = DatingDatePlanReminder.Status.PENDING
                    reminder.available_at = now + timedelta(
                        seconds=min(3600, 30 * (2 ** (reminder.attempts - 1)))
                    )
            finally:
                reminder.locked_at = None
                reminder.save(update_fields=(
                    "status", "sent_at", "last_error", "available_at", "locked_at", "updated_at"
                ))
                processed += 1

    return processed
