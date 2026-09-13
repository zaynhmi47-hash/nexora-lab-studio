from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class Product(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        DEPRECATED = "deprecated", "Deprecated"

    class ProductType(models.TextChoices):
        INTERNAL = "internal", "Internal"
        EXTERNAL = "external", "External"
        PARTNER = "partner", "Partner"
        PLATFORM = "platform", "Platform"

    key = models.CharField(max_length=100, unique=True, db_index=True, validators=[RegexValidator(regex=r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$", message="Product keys must be lowercase kebab-case identifiers.")])
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    product_type = models.CharField(max_length=16, choices=ProductType.choices, default=ProductType.PLATFORM, db_index=True)
    version = models.CharField(max_length=32, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "products"
        ordering = ("name", "created_at")
        indexes = [models.Index(fields=("status", "product_type"), name="product_status_type_idx")]

    def clean(self):
        super().clean()
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Product metadata must be a JSON object."})
        if self.pk:
            previous_key = type(self).objects.filter(pk=self.pk).values_list("key", flat=True).first()
            if previous_key is not None and previous_key != self.key:
                raise ValidationError({"key": "Product key is immutable."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Products must be soft-deleted.")

    def __str__(self) -> str:
        return f"{self.name} ({self.key})"
