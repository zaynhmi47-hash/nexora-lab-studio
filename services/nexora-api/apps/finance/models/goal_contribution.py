from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class FinanceGoalContribution(AuditableBaseModel):
    class Status(models.TextChoices):
        POSTED = "posted", "Posted"
        VOID = "void", "Void"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="finance_goal_contributions",
    )
    goal = models.ForeignKey(
        "finance.FinanceGoal",
        on_delete=models.CASCADE,
        related_name="contributions",
    )
    amount_minor = models.BigIntegerField(validators=[MinValueValidator(1)])
    currency = models.CharField(max_length=3, default="IDR")
    contributed_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=6, choices=Status.choices, default=Status.POSTED, db_index=True)
    note = models.CharField(max_length=500, blank=True)
    reference = models.CharField(max_length=150, blank=True)
    idempotency_key = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "finance_goal_contributions"
        ordering = ("-contributed_at", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "idempotency_key"),
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(idempotency_key=""),
                name="finance_goal_contrib_org_idempotency_unique",
            )
        ]
        indexes = [
            models.Index(fields=("organization", "goal", "contributed_at"), name="finance_goal_contrib_period_idx"),
            models.Index(fields=("organization", "status"), name="finance_goal_contrib_status_idx"),
        ]

    def clean(self):
        super().clean()
        if self.amount_minor <= 0:
            raise ValidationError({"amount_minor": "Contribution amount must be greater than zero."})
        if self.currency != "IDR":
            raise ValidationError({"currency": "Only IDR is supported by the initial finance domain contract."})
        if not isinstance(self.metadata, dict):
            raise ValidationError({"metadata": "Metadata must be a JSON object."})
        if self.goal_id and self.organization_id and self.goal.organization_id != self.organization_id:
            raise ValidationError({"organization": "Goal and contribution must belong to the same organization."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.goal_id}:{self.amount_minor}:{self.currency}"
