from django.db import models
from django.db.models import F, Q

from apps.core.models import AuditableBaseModel


class AcademicTerm(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_terms",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=120)
    starts_on = models.DateField()
    ends_on = models.DateField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)

    class Meta:
        db_table = "academic_terms"
        ordering = ("-starts_on", "code")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "code"),
                condition=Q(deleted_at__isnull=True),
                name="academic_term_org_code_unique",
            ),
            models.CheckConstraint(condition=Q(ends_on__gte=F("starts_on")), name="academic_term_valid_dates"),
        ]
        indexes = [models.Index(fields=("organization", "status"), name="academic_term_org_status_idx")]

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.code}"
