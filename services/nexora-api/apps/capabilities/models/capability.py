from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class Capability(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        DEPRECATED = "deprecated", "Deprecated"

    key = models.CharField(max_length=100, unique=True, db_index=True, validators=[RegexValidator(regex=r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$", message="Capability keys must be lowercase kebab-case identifiers.")])
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "capabilities"
        ordering = ("name", "created_at")
        indexes = [models.Index(fields=("status",), name="capability_status_idx")]

    def clean(self):
        super().clean()
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Capability metadata must be a JSON object."})
        if self.pk:
            previous_key = type(self).objects.filter(pk=self.pk).values_list("key", flat=True).first()
            if previous_key is not None and previous_key != self.key:
                raise ValidationError({"key": "Capability key is immutable."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Capabilities must be soft-deleted.")

    def __str__(self) -> str:
        return f"{self.name} ({self.key})"
