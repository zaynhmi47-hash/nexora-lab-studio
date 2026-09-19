from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class FinanceBudget(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="finance_budgets",
    )
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    amount_minor = models.BigIntegerField(validators=[MinValueValidator(1)])
    currency = models.CharField(max_length=3, default="IDR")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.ACTIVE)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "finance_budgets"
        ordering = ("-start_date", "category", "name")
        indexes = [
            models.Index(fields=("organization", "start_date", "end_date"), name="finance_budget_period_idx"),
            models.Index(fields=("organization", "status"), name="finance_budget_status_idx"),
        ]

    def clean(self):
        super().clean()
        if self.end_date < self.start_date:
            raise ValidationError({"end_date": "end_date must be on or after start_date."})
        if self.currency != "IDR":
            raise ValidationError({"currency": "Only IDR is supported by the initial finance domain contract."})
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Metadata must be a JSON object."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.category}:{self.name}"
