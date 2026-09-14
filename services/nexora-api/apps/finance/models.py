from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class Transaction(AuditableBaseModel):
    class TransactionType(models.TextChoices):
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="finance_transactions",
    )
    transaction_type = models.CharField(max_length=16, choices=TransactionType.choices)
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(max_length=3, default="IDR")
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    occurred_at = models.DateTimeField()

    class Meta:
        db_table = "finance_transactions"
        ordering = ("-occurred_at", "-created_at")
        indexes = [
            models.Index(fields=("organization", "occurred_at"), name="finance_tx_org_date_idx"),
            models.Index(fields=("organization", "transaction_type"), name="finance_tx_org_type_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.transaction_type}:{self.amount} {self.currency}"
