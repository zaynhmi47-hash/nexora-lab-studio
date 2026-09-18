from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class FinanceTransaction(AuditableBaseModel):
    class Direction(models.TextChoices):
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"

    class Status(models.TextChoices):
        POSTED = "posted", "Posted"
        VOID = "void", "Void"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="finance_transactions",
    )
    direction = models.CharField(max_length=8, choices=Direction.choices, db_index=True)
    amount_minor = models.BigIntegerField(validators=[MinValueValidator(1)])
    currency = models.CharField(max_length=3, default="IDR")
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=500, blank=True)
    occurred_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.POSTED, db_index=True)
    reference = models.CharField(max_length=150, blank=True)
    idempotency_key = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "finance_transactions"
        ordering = ("-occurred_at", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "idempotency_key"),
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(idempotency_key=""),
                name="finance_tx_org_idempotency_unique",
            )
        ]
        indexes = [
            models.Index(fields=("organization", "occurred_at"), name="finance_tx_org_occurred_idx"),
            models.Index(fields=("organization", "direction", "status"), name="finance_tx_org_flow_idx"),
        ]

    def clean(self):
        super().clean()
        if self.amount_minor <= 0:
            raise ValidationError({"amount_minor": "Transaction amount must be greater than zero."})
        if self.currency != "IDR":
            raise ValidationError({"currency": "Only IDR is supported by the initial finance domain contract."})
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Metadata must be a JSON object."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Finance transactions must be soft-deleted.")

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.direction}:{self.amount_minor}:{self.currency}"
