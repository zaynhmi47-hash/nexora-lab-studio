from django.db import models
from django.utils import timezone

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

from .match import DatingMatch


class DatingDatePlan(AuditableBaseModel):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    class Activity(models.TextChoices):
        COFFEE = "coffee", "Coffee"
        FOOD = "food", "Food"
        WALK = "walk", "Walk"
        ART = "art", "Art and culture"
        MOVIE = "movie", "Movie"
        OUTDOOR = "outdoor", "Outdoor"
        OTHER = "other", "Other"

    match = models.ForeignKey(DatingMatch, on_delete=models.PROTECT, related_name="date_plans")
    organizer = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_plans_created")
    activity = models.CharField(max_length=16, choices=Activity.choices, default=Activity.OTHER)
    title = models.CharField(max_length=120)
    starts_at = models.DateTimeField()
    timezone_name = models.CharField(max_length=64, default="Asia/Jakarta")
    location_name = models.CharField(max_length=180)
    notes = models.CharField(max_length=1000, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PROPOSED, db_index=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(NexoraUser, null=True, blank=True, on_delete=models.PROTECT, related_name="dating_plans_cancelled")
    cancelled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    reschedule_proposed_by = models.ForeignKey(NexoraUser, null=True, blank=True, on_delete=models.PROTECT, related_name="dating_plan_reschedules_proposed")
    proposed_starts_at = models.DateTimeField(null=True, blank=True)
    proposed_timezone_name = models.CharField(max_length=64, blank=True)
    proposed_location_name = models.CharField(max_length=180, blank=True)
    proposed_notes = models.CharField(max_length=1000, blank=True)
    reschedule_proposed_at = models.DateTimeField(null=True, blank=True)
    reminder_version = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "dating_date_plans"
        indexes = [
            models.Index(fields=("match", "starts_at")),
            models.Index(fields=("status", "starts_at")),
        ]


class DatingRelationshipMilestone(AuditableBaseModel):
    class Stage(models.TextChoices):
        FIRST_HELLO = "first_hello", "First hello"
        GETTING_TO_KNOW = "getting_to_know", "Getting to know"
        FIRST_DATE = "first_date", "First date"
        BUILDING_TRUST = "building_trust", "Building trust"
        DEFINING_RELATIONSHIP = "defining_relationship", "Defining the relationship"

    match = models.ForeignKey(DatingMatch, on_delete=models.PROTECT, related_name="relationship_milestones")
    stage = models.CharField(max_length=32, choices=Stage.choices)
    acknowledged_by_a_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by_b_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_relationship_milestones"
        constraints = [
            models.UniqueConstraint(fields=("match", "stage"), name="dating_milestone_match_stage_unique"),
        ]
        indexes = [models.Index(fields=("match", "stage"))]


class DatingDatePlanReminder(AuditableBaseModel):
    class ReminderType(models.TextChoices):
        ONE_DAY = "one_day", "24 hours before"
        ONE_HOUR = "one_hour", "1 hour before"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    date_plan = models.ForeignKey(DatingDatePlan, on_delete=models.CASCADE, related_name="reminders")
    recipient = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="dating_date_plan_reminders")
    reminder_type = models.CharField(max_length=16, choices=ReminderType.choices)
    schedule_version = models.PositiveIntegerField(default=0)
    scheduled_for = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    available_at = models.DateTimeField(db_index=True, default=timezone.now)
    locked_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "dating_date_plan_reminders"
        constraints = [
            models.UniqueConstraint(
                fields=("date_plan", "recipient", "reminder_type", "schedule_version"),
                name="dating_plan_reminder_version_unique",
            ),
        ]
        indexes = [
            models.Index(fields=("status", "available_at"), name="dating_plan_reminder_queue_idx"),
        ]
