from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class TajwidTopic(AuditableBaseModel):
    key = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(unique=True)
    xp_reward = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "tajwid_topics"
        ordering = ("sort_order",)


class TajwidPracticeItem(AuditableBaseModel):
    key = models.SlugField(max_length=120, unique=True)
    topic = models.ForeignKey(TajwidTopic, on_delete=models.CASCADE, related_name="practice_items")
    prompt = models.TextField()
    options = models.JSONField(default=list)
    correct_option_index = models.PositiveIntegerField(default=0)
    explanation = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "tajwid_practice_items"
        ordering = ("topic", "sort_order")


class TajwidProgress(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="tajwid_progress")
    practice_completed = models.PositiveIntegerField(default=0)
    assessment_completed = models.BooleanField(default=False)
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "tajwid_progress"


class TajwidTopicCompletion(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="tajwid_topic_completions")
    topic = models.ForeignKey(TajwidTopic, on_delete=models.PROTECT, related_name="user_completions")
    completed_at = models.DateTimeField()

    class Meta:
        db_table = "tajwid_topic_completions"
        constraints = [
            models.UniqueConstraint(fields=("user", "topic"), name="tajwid_user_topic_unique"),
        ]
