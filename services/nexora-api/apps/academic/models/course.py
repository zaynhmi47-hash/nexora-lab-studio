from django.core.validators import MaxValueValidator, MinValueValidator, MinLengthValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicCourse(AuditableBaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_courses",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=180, validators=[MinLengthValidator(2)])
    description = models.TextField(blank=True)
    credit_units = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "academic_courses"
        ordering = ("code",)
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "code"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_course_org_code_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(credit_units__gte=1, credit_units__lte=12),
                name="academic_course_credit_range",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "is_active"), name="acad_course_org_active_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.code}"
