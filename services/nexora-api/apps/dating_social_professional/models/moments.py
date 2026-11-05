from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class DatingMoment(AuditableBaseModel):
    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Only me"

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    author = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_moments")
    caption = models.TextField(max_length=2000)
    # media_url is retained for legacy/external media references.
    media_url = models.URLField(max_length=2048, blank=True)
    storage_key = models.CharField(max_length=512, blank=True)
    media_type = models.CharField(max_length=16, choices=MediaType.choices, blank=True)
    visibility = models.CharField(max_length=16, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True)

    class Meta:
        db_table = "dating_moments"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("visibility", "created_at"), name="dating_moment_feed_idx"),
            models.Index(fields=("author", "created_at"), name="dating_moment_author_idx"),
        ]

    def __str__(self) -> str:
        return f"Moment by {self.author_id}"
