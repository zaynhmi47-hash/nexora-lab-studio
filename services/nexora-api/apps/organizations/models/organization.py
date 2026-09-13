from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models.functions import Lower

from apps.core.models import AuditableBaseModel


class Organization(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        DEACTIVATED = "deactivated", "Deactivated"

    name = models.CharField(max_length=255, validators=[MinLengthValidator(2)])
    slug = models.SlugField(max_length=100)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "organizations"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                Lower("slug"),
                condition=models.Q(deleted_at__isnull=True),
                name="org_active_slug_unique",
            )
        ]
        indexes = [models.Index(fields=("status",), name="org_status_idx")]

    def __str__(self) -> str:
        return self.name
