from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicCurriculumCourse(AuditableBaseModel):
    class Requirement(models.TextChoices):
        REQUIRED = "required", "Required"
        ELECTIVE = "elective", "Elective"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_curriculum_courses",
    )
    program = models.ForeignKey(
        "academic.AcademicProgram",
        on_delete=models.PROTECT,
        related_name="curriculum_courses",
    )
    course = models.ForeignKey(
        "academic.AcademicCourse",
        on_delete=models.PROTECT,
        related_name="curriculum_entries",
    )
    curriculum_version = models.CharField(max_length=32, default="v1")
    recommended_term = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(16)],
    )
    credit_units = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
    )
    requirement = models.CharField(
        max_length=12,
        choices=Requirement.choices,
        default=Requirement.REQUIRED,
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "academic_curriculum_courses"
        ordering = ("program_id", "recommended_term", "course__code")
        constraints = [
            models.UniqueConstraint(
                fields=("program", "course", "curriculum_version"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_curriculum_course_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(recommended_term__gte=1, recommended_term__lte=16),
                name="academic_curriculum_term_range",
            ),
            models.CheckConstraint(
                condition=models.Q(credit_units__gte=1, credit_units__lte=12),
                name="academic_curriculum_credit_range",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "program", "curriculum_version", "is_active"),
                name="acad_curriculum_lookup_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.organization_id and self.program_id and self.program.organization_id != self.organization_id:
            errors["program"] = "The program must belong to the curriculum organization."
        if self.organization_id and self.course_id and self.course.organization_id != self.organization_id:
            errors["course"] = "The course must belong to the curriculum organization."
        if errors:
            from django.core.exceptions import ValidationError
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.program_id}:{self.course_id}:{self.curriculum_version}"
