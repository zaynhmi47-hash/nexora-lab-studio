from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicClassroom(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_classrooms",
    )
    program = models.ForeignKey(
        "academic.AcademicProgram",
        on_delete=models.PROTECT,
        related_name="classrooms",
    )
    term = models.ForeignKey(
        "academic.AcademicTerm",
        on_delete=models.PROTECT,
        related_name="classrooms",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=180)
    capacity = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True)

    class Meta:
        db_table = "academic_classrooms"
        ordering = ("term__starts_on", "code")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "term", "code"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_class_org_term_code_unique",
            )
        ]
        indexes = [models.Index(fields=("organization", "term", "status"), name="academic_class_org_term_idx")]

    def clean(self):
        super().clean()
        errors = {}
        if self.organization_id and self.program_id and self.program.organization_id != self.organization_id:
            errors["program"] = "The program must belong to the classroom organization."
        if self.organization_id and self.term_id and self.term.organization_id != self.organization_id:
            errors["term"] = "The term must belong to the classroom organization."
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.code}"
