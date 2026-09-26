from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingMatch(AuditableBaseModel):
    user_a = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_matches_a")
    user_b = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_matches_b")
    matched_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "dating_matches"
        constraints = [
            models.UniqueConstraint(fields=("user_a", "user_b"), name="dating_match_pair_unique"),
        ]
        indexes = [models.Index(fields=("user_a", "active")), models.Index(fields=("user_b", "active"))]
