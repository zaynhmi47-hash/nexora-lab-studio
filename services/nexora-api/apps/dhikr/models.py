from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class Dhikr(AuditableBaseModel):
    class Category(models.TextChoices):
        MORNING = "morning", "Morning"
        EVENING = "evening", "Evening"
        GENERAL = "general", "General"

    key = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    arabic = models.TextField()
    transliteration = models.TextField()
    translation = models.TextField()
    target = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    category = models.CharField(max_length=16, choices=Category.choices, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "dhikr_items"
        ordering = ("category", "title")


class DhikrProgress(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="dhikr_progress")
    dhikr = models.ForeignKey(Dhikr, on_delete=models.PROTECT, related_name="progress")
    completed = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "dhikr_progress"
        constraints = [models.UniqueConstraint(fields=("user", "dhikr"), name="dhikr_user_item_unique")]


class DhikrHistoryEntry(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="dhikr_history")
    dhikr = models.ForeignKey(Dhikr, on_delete=models.PROTECT, related_name="history")
    count = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    completed_at = models.DateTimeField()

    class Meta:
        db_table = "dhikr_history"
        ordering = ("-completed_at",)
        indexes = [models.Index(fields=("user", "dhikr", "completed_at"), name="dhikr_history_user_item_idx")]
