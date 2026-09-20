from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class GamificationActivity(AuditableBaseModel):
    class Source(models.TextChoices):
        LEARNING = "learning", "Learning"
        TAJWID = "tajwid", "Tajwid"
        ARABIC = "arabic", "Arabic"
        GAMIFICATION = "gamification", "Gamification"

    user = models.ForeignKey(
        NexoraUser,
        on_delete=models.CASCADE,
        related_name="gamification_activities",
    )
    source = models.CharField(max_length=32, choices=Source.choices)
    action = models.CharField(max_length=64)
    source_key = models.CharField(max_length=150)
    xp_earned = models.PositiveIntegerField(default=0)
    occurred_at = models.DateTimeField()

    class Meta:
        db_table = "gamification_activities"
        constraints = [
            models.UniqueConstraint(
                fields=("user", "source", "action", "source_key"),
                name="gamification_activity_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("user", "-occurred_at"),
                name="gamification_user_date_idx",
            ),
        ]
