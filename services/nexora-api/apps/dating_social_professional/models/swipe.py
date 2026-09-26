from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser
from .profile import DatingProfile


class DatingSwipe(AuditableBaseModel):
    class Action(models.TextChoices):
        LIKE = "like", "Like"
        PASS = "pass", "Pass"

    actor = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_swipes_sent")
    target = models.ForeignKey(DatingProfile, on_delete=models.PROTECT, related_name="swipes_received")
    action = models.CharField(max_length=16, choices=Action.choices)

    class Meta:
        db_table = "dating_swipes"
        constraints = [
            models.UniqueConstraint(fields=("actor", "target"), name="dating_swipe_actor_target_unique"),
        ]
        indexes = [models.Index(fields=("actor", "created_at")), models.Index(fields=("target", "action"))]
