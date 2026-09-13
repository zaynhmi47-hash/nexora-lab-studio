from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel


class ProductCapability(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    product = models.ForeignKey("products.Product", on_delete=models.PROTECT, related_name="product_capabilities")
    capability = models.ForeignKey("capabilities.Capability", on_delete=models.PROTECT, related_name="product_capabilities")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "product_capabilities"
        constraints = [models.UniqueConstraint(fields=("product", "capability"), name="product_capability_pair_unique")]
        indexes = [models.Index(fields=("product", "status"), name="prod_cap_product_status_idx"), models.Index(fields=("capability", "status"), name="prod_cap_cap_status_idx")]

    def clean(self):
        super().clean()
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Product capability metadata must be a JSON object."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Product capabilities must be soft-deleted.")

    def __str__(self) -> str:
        return f"{self.product_id}:{self.capability_id}"
