import uuid

from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class GrowthGoal(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    class Category(models.TextChoices):
        PERSONAL = "personal", "Personal"
        LEARNING = "learning", "Learning"
        CAREER = "career", "Career"
        WELLNESS = "wellness", "Wellness"
        RELATIONSHIP = "relationship", "Relationship"
        FINANCIAL = "financial", "Financial"
        CONTRIBUTION = "contribution", "Contribution"
        OTHER = "other", "Other"

    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="growth_goals")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.PERSONAL)
    success_criteria = models.JSONField(default=list, blank=True)
    start_date = models.DateField()
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "growth_goals"
        ordering = ("status", "target_date", "-created_at")
        indexes = [
            models.Index(fields=("user", "status"), name="growth_goal_user_status_idx"),
            models.Index(fields=("user", "target_date"), name="growth_goal_user_target_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(target_date__isnull=True) | models.Q(target_date__gte=models.F("start_date")),
                name="growth_goal_target_after_start_ck",
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(status="completed")
                    | models.Q(completed_at__isnull=False)
                ),
                name="growth_goal_completed_at_ck",
            ),
        ]

    def clean(self):
        super().clean()
        if not isinstance(self.success_criteria, list):
            raise ValidationError({"success_criteria": "Success criteria must be a list."})
        if any(not isinstance(item, str) or not item.strip() for item in self.success_criteria):
            raise ValidationError({"success_criteria": "Each success criterion must be a non-empty string."})

    def __str__(self):
        return self.title


class GrowthJournalEntry(AuditableBaseModel):
    class Mood(models.TextChoices):
        VERY_LOW = "very_low", "Very low"
        LOW = "low", "Low"
        NEUTRAL = "neutral", "Neutral"
        GOOD = "good", "Good"
        VERY_GOOD = "very_good", "Very good"

    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="growth_journal_entries")
    entry_date = models.DateField()
    title = models.CharField(max_length=180, blank=True)
    prompt = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    mood = models.CharField(max_length=12, choices=Mood.choices, blank=True)
    gratitude = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "growth_journal_entries"
        ordering = ("-entry_date", "-created_at")
        indexes = [
            models.Index(fields=("user", "-entry_date"), name="growth_journal_user_date_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(body=""),
                name="growth_journal_body_not_empty_ck",
            ),
        ]

    def clean(self):
        super().clean()
        if not self.body.strip():
            raise ValidationError({"body": "Journal entry cannot be empty."})
        if not isinstance(self.gratitude, list):
            raise ValidationError({"gratitude": "Gratitude items must be a list."})
        if any(not isinstance(item, str) or not item.strip() for item in self.gratitude):
            raise ValidationError({"gratitude": "Each gratitude item must be a non-empty string."})

    def __str__(self):
        return self.title or f"Private reflection {self.entry_date}"


class GrowthHabit(AuditableBaseModel):
    class Frequency(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        ARCHIVED = "archived", "Archived"

    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="growth_habits")
    goal = models.ForeignKey(
        GrowthGoal,
        on_delete=models.SET_NULL,
        related_name="habits",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=8, choices=Frequency.choices, default=Frequency.DAILY)
    weekly_target = models.PositiveSmallIntegerField(default=7)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        db_table = "growth_habits"
        ordering = ("status", "start_date", "title")
        indexes = [
            models.Index(fields=("user", "status"), name="growth_habit_user_status_idx"),
            models.Index(fields=("user", "start_date"), name="growth_habit_user_start_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(weekly_target__gte=1) & models.Q(weekly_target__lte=7),
                name="growth_habit_weekly_target_ck",
            ),
            models.CheckConstraint(
                condition=models.Q(end_date__isnull=True) | models.Q(end_date__gte=models.F("start_date")),
                name="growth_habit_end_after_start_ck",
            ),
        ]

    def clean(self):
        super().clean()
        if self.frequency == self.Frequency.DAILY and self.weekly_target != 7:
            raise ValidationError({"weekly_target": "Daily habits use a seven-day target."})
        if self.goal_id and self.goal.user_id != self.user_id:
            raise ValidationError({"goal": "A habit can only link to one of your own goals."})

    def __str__(self):
        return self.title


class GrowthHabitCheckIn(AuditableBaseModel):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"

    habit = models.ForeignKey(GrowthHabit, on_delete=models.CASCADE, related_name="check_ins")
    entry_date = models.DateField()
    status = models.CharField(max_length=12, choices=Status.choices)
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "growth_habit_check_ins"
        ordering = ("-entry_date", "-created_at")
        indexes = [
            models.Index(fields=("habit", "-entry_date"), name="growth_checkin_habit_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=("habit", "entry_date"),
                condition=models.Q(deleted_at__isnull=True),
                name="growth_checkin_habit_date_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.habit.title} · {self.entry_date} · {self.status}"

class GrowthEvidenceEvent(models.Model):
    """Minimal, append-only index of non-sensitive growth activity."""

    class EventType(models.TextChoices):
        GOAL_CREATED = "goal.created", "Goal created"
        GOAL_STATUS_CHANGED = "goal.status_changed", "Goal status changed"
        HABIT_CREATED = "habit.created", "Habit created"
        HABIT_CHECK_IN_RECORDED = "habit.check_in_recorded", "Habit check-in recorded"
        HABIT_CHECK_IN_CHANGED = "habit.check_in_changed", "Habit check-in changed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        NexoraUser,
        on_delete=models.CASCADE,
        related_name="growth_evidence_events",
    )
    event_type = models.CharField(max_length=40, choices=EventType.choices)
    subject_type = models.CharField(max_length=32)
    subject_id = models.CharField(max_length=64)
    event_key = models.CharField(max_length=180, unique=True)
    occurred_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "growth_evidence_events"
        ordering = ("-occurred_at", "-id")
        indexes = [
            models.Index(fields=("user", "-occurred_at"), name="growth_event_user_time_idx"),
            models.Index(fields=("subject_type", "subject_id"), name="growth_event_subject_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError("Growth evidence events are immutable.")
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Event metadata must be an object."})
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Growth evidence events cannot be deleted through the model API.")

    def __str__(self):
        return f"{self.event_type}:{self.subject_type}:{self.subject_id}"
