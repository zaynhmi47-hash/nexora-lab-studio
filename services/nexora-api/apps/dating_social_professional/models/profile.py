from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingProfile(AuditableBaseModel):
    class RelationshipIntent(models.TextChoices):
        DATING = "dating", "Dating"
        RELATIONSHIP = "relationship", "Relationship"
        FRIENDSHIP = "friendship", "Friendship"

    user = models.OneToOneField(NexoraUser, on_delete=models.PROTECT, related_name="dating_profile")
    display_name = models.CharField(max_length=120)
    birth_date = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True, max_length=2000)
    photo_url = models.URLField(max_length=2048, blank=True)
    relationship_intent = models.CharField(max_length=32, choices=RelationshipIntent.choices, blank=True)
    discovery_enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "dating_profiles"
        indexes = [models.Index(fields=("discovery_enabled", "updated_at"))]

    def __str__(self) -> str:
        return self.display_name
