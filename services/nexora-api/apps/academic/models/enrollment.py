from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicEnrollment(AuditableBaseModel):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        INSTRUCTOR = "instructor", "Instructor"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        WITHDRAWN = "withdrawn", "Withdrawn"
        COMPLETED = "completed", "Completed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_enrollments",
    )
    classroom = models.ForeignKey(
        "academic.AcademicClassroom",
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    term = models.ForeignKey(
        "academic.AcademicTerm",
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="academic_enrollments",
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.STUDENT)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        db_table = "academic_enrollments"
        constraints = [
            models.UniqueConstraint(
                fields=("classroom", "membership", "role"),
                condition=models.Q(deleted_at__isnull=True, status="active"),
                name="academic_enrollment_active_unique",
            )
        ]
        indexes = [
            models.Index(fields=("organization", "term", "status"), name="academic_enroll_org_term_idx"),
            models.Index(fields=("membership", "status"), name="academic_enroll_member_status_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.organization_id and self.classroom_id and self.classroom.organization_id != self.organization_id:
            errors["classroom"] = "The classroom must belong to the enrollment organization."
        if self.organization_id and self.term_id and self.term.organization_id != self.organization_id:
            errors["term"] = "The term must belong to the enrollment organization."
        if self.organization_id and self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "The membership must belong to the enrollment organization."
        if self.classroom_id and self.term_id and self.classroom.term_id != self.term_id:
            errors["term"] = "The enrollment term must match the classroom term."
        if self.membership_id and self.membership.status != self.membership.Status.ACTIVE:
            errors["membership"] = "Only active organization memberships can be enrolled."
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.classroom_id}:{self.membership_id}"
