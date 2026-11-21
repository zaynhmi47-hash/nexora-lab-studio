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
