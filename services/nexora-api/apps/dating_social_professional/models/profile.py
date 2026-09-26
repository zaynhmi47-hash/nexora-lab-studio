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
    preferred_min_age = models.PositiveSmallIntegerField(default=18)
    preferred_max_age = models.PositiveSmallIntegerField(default=99)
    interests = models.JSONField(default=list, blank=True)
    education = models.CharField(max_length=160, blank=True)
    occupation = models.CharField(max_length=160, blank=True)
    location_city = models.CharField(max_length=120, blank=True)
    location_country = models.CharField(max_length=120, blank=True)
    location_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    max_distance_km = models.PositiveIntegerField(default=100, blank=True)

    class Meta:
        db_table = "dating_profiles"
        indexes = [models.Index(fields=("discovery_enabled", "updated_at"))]

    def __str__(self) -> str:
        return self.display_name


class DatingProfileMedia(AuditableBaseModel):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"

    profile = models.ForeignKey(DatingProfile, on_delete=models.CASCADE, related_name="media")
    url = models.URLField(max_length=2048, blank=True)
    storage_key = models.CharField(max_length=512, blank=True)
    media_type = models.CharField(max_length=16, choices=MediaType.choices, default=MediaType.IMAGE)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "dating_profile_media"
        ordering = ("sort_order", "created_at")
        indexes = [models.Index(fields=("profile", "active", "sort_order"))]
