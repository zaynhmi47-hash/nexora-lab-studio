from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class FinanceGoal(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        ARCHIVED = "archived", "Archived"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="finance_goals",
    )
    name = models.CharField(max_length=150)
    target_amount_minor = models.BigIntegerField(validators=[MinValueValidator(1)])
    currency = models.CharField(max_length=3, default="IDR")
    start_date = models.DateField()
    target_date = models.DateField()
    status = models.CharField(max_length=9, choices=Status.choices, default=Status.ACTIVE)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "finance_goals"
        ordering = ("status", "target_date", "name")
        indexes = [
            models.Index(fields=("organization", "status"), name="finance_goal_org_status_idx"),
            models.Index(fields=("organization", "target_date"), name="finance_goal_org_target_idx"),
        ]

    def clean(self):
        super().clean()
        if self.target_date < self.start_date:
            raise ValidationError({"target_date": "target_date must be on or after start_date."})
        if self.currency != "IDR":
            raise ValidationError({"currency": "Only IDR is supported by the initial finance domain contract."})
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Metadata must be a JSON object."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.name}"
