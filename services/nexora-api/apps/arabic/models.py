from __future__ import annotations

from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class ArabicPath(AuditableBaseModel):
    key = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(unique=True)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "arabic_paths"
        ordering = ("sort_order",)


class ArabicLesson(AuditableBaseModel):
    class Kind(models.TextChoices):
        VOCABULARY = "vocabulary", "Vocabulary"
        PHRASE = "phrase", "Phrase"
        PRACTICE = "practice", "Practice"

    key = models.SlugField(max_length=100, unique=True)
    path = models.ForeignKey(ArabicPath, on_delete=models.PROTECT, related_name="lessons")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.VOCABULARY)
    sort_order = models.PositiveIntegerField()
    xp_reward = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1)])
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "arabic_lessons"
        ordering = ("path", "sort_order")
        constraints = [models.UniqueConstraint(fields=("path", "sort_order"), name="arabic_path_lesson_order_unique")]


class ArabicPracticeItem(AuditableBaseModel):
    key = models.SlugField(max_length=120, unique=True)
    lesson = models.ForeignKey(ArabicLesson, on_delete=models.CASCADE, related_name="practice_items")
    prompt = models.TextField()
    options = models.JSONField(default=list)
    correct_option_index = models.PositiveIntegerField(default=0)
    explanation = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "arabic_practice_items"
        ordering = ("lesson", "sort_order")
        constraints = [models.UniqueConstraint(fields=("lesson", "sort_order"), name="arabic_lesson_practice_order_unique")]


class ArabicProgress(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="arabic_progress")
    xp_earned = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    last_completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "arabic_progress"


class ArabicLessonCompletion(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="arabic_lesson_completions")
    lesson = models.ForeignKey(ArabicLesson, on_delete=models.PROTECT, related_name="completions")
    completed_at = models.DateTimeField()

    class Meta:
        db_table = "arabic_lesson_completions"
        constraints = [models.UniqueConstraint(fields=("user", "lesson"), name="arabic_user_lesson_completion_unique")]
        indexes = [models.Index(fields=("user", "completed_at"), name="arabic_lesson_user_date_idx")]
