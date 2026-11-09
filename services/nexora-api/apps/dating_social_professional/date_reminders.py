from datetime import timedelta

from django.utils import timezone

from .models import DatingDatePlan, DatingDatePlanReminder


def schedule_date_plan_reminders(plan: DatingDatePlan) -> int:
    """Replace pending reminders with a new version for both matched participants."""
    if plan.status != DatingDatePlan.Status.ACCEPTED:
        return 0

    now = timezone.now()
    plan.reminder_version += 1
    plan.save(update_fields=("reminder_version", "updated_at"))
    DatingDatePlanReminder.objects.filter(
        date_plan=plan,
        status__in=(DatingDatePlanReminder.Status.PENDING, DatingDatePlanReminder.Status.PROCESSING),
    ).update(status=DatingDatePlanReminder.Status.CANCELLED, locked_at=None, updated_at=now)

    recipients = (plan.match.user_a_id, plan.match.user_b_id)
    created = 0
    for recipient_id in recipients:
        for reminder_type, lead in (
            (DatingDatePlanReminder.ReminderType.ONE_DAY, timedelta(hours=24)),
            (DatingDatePlanReminder.ReminderType.ONE_HOUR, timedelta(hours=1)),
        ):
            scheduled_for = max(now, plan.starts_at - lead)
            if scheduled_for >= plan.starts_at:
                continue
            _, was_created = DatingDatePlanReminder.objects.get_or_create(
                date_plan=plan,
                recipient_id=recipient_id,
                reminder_type=reminder_type,
                schedule_version=plan.reminder_version,
                defaults={
                    "scheduled_for": scheduled_for,
                    "available_at": scheduled_for,
                    "status": DatingDatePlanReminder.Status.PENDING,
                },
            )
            created += int(was_created)
    return created


def cancel_date_plan_reminders(plan: DatingDatePlan) -> int:
    return DatingDatePlanReminder.objects.filter(
        date_plan=plan,
        status__in=(DatingDatePlanReminder.Status.PENDING, DatingDatePlanReminder.Status.PROCESSING),
    ).update(status=DatingDatePlanReminder.Status.CANCELLED, locked_at=None, updated_at=timezone.now())
