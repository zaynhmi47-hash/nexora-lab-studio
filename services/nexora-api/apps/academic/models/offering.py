from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicCourseOffering(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_course_offerings",
    )
    classroom = models.ForeignKey(
        "academic.AcademicClassroom",
        on_delete=models.PROTECT,
        related_name="course_offerings",
    )
    course = models.ForeignKey(
        "academic.AcademicCourse",
        on_delete=models.PROTECT,
        related_name="offerings",
    )
    curriculum_entry = models.ForeignKey(
        "academic.AcademicCurriculumCourse",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="offerings",
    )
    code = models.CharField(max_length=40)
    capacity = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)

    class Meta:
        db_table = "academic_course_offerings"
        ordering = ("classroom__term__starts_on", "code")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "classroom", "code"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_offering_org_class_code_unique",
            ),
            models.UniqueConstraint(
                fields=("classroom", "course"),
                condition=models.Q(deleted_at__isnull=True, status__in=("draft", "open")),
                name="academic_offering_active_course_unique",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "classroom", "status"), name="acad_offering_class_idx"),
            models.Index(fields=("organization", "course"), name="acad_offering_course_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.organization_id and self.classroom_id and self.classroom.organization_id != self.organization_id:
            errors["classroom"] = "The classroom must belong to the offering organization."
        if self.organization_id and self.course_id and self.course.organization_id != self.organization_id:
            errors["course"] = "The course must belong to the offering organization."
        if self.classroom_id and self.course_id and self.classroom.program_id:
            if not self.classroom.program.is_active:
                errors["classroom"] = "The classroom program must be active."
        if self.curriculum_entry_id:
            entry = self.curriculum_entry
            if entry.organization_id != self.organization_id:
                errors["curriculum_entry"] = "The curriculum entry must belong to the offering organization."
            if entry.course_id != self.course_id:
                errors["curriculum_entry"] = "The curriculum entry must reference the offered course."
            if self.classroom_id and entry.program_id != self.classroom.program_id:
                errors["curriculum_entry"] = "The curriculum program must match the classroom program."
        if self.capacity and self.classroom_id and self.classroom.capacity:
            if self.capacity > self.classroom.capacity:
                errors["capacity"] = "Offering capacity cannot exceed classroom capacity."
        if self.status == self.Status.OPEN and self.classroom_id:
            if self.classroom.status not in ("open", "in_progress"):
                errors["status"] = "An offering can only open when its classroom is open or in progress."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.organization_id}:{self.code}"
