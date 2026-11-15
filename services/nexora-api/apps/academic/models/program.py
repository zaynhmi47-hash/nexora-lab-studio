from django.core.validators import MinLengthValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicProgram(AuditableBaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_programs",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=180, validators=[MinLengthValidator(2)])
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "academic_programs"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "code"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_program_org_code_unique",
            )
        ]
        indexes = [models.Index(fields=("organization", "is_active"), name="acad_program_org_active_idx")]

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.code}"
