from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicCoursePrerequisite(AuditableBaseModel):
    """A directed prerequisite edge: course requires prerequisite_course."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_course_prerequisites",
    )
    course = models.ForeignKey(
        "academic.AcademicCourse",
        on_delete=models.CASCADE,
        related_name="prerequisite_rules",
    )
    prerequisite_course = models.ForeignKey(
        "academic.AcademicCourse",
        on_delete=models.PROTECT,
        related_name="required_by_rules",
    )
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        db_table = "academic_course_prerequisites"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "course", "prerequisite_course"),
                condition=models.Q(deleted_at__isnull=True),
                name="academic_course_prereq_unique",
            ),
            models.CheckConstraint(
                condition=~models.Q(course=models.F("prerequisite_course")),
                name="academic_course_prereq_not_self",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "course"),
                name="acad_prereq_course_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.course_id and self.prerequisite_course_id:
            if self.course_id == self.prerequisite_course_id:
                errors["prerequisite_course"] = "A course cannot require itself."
            if self.course.organization_id != self.organization_id:
                errors["course"] = "Course must belong to this organization."
            if self.prerequisite_course.organization_id != self.organization_id:
                errors["prerequisite_course"] = "Prerequisite must belong to this organization."
        if errors:
            raise ValidationError(errors)


class AcademicCourseCompletion(AuditableBaseModel):
    """Verified evidence that a member completed a course in this organization."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Verification"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_course_completions",
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="academic_course_completions",
    )
    course = models.ForeignKey(
        "academic.AcademicCourse",
        on_delete=models.PROTECT,
        related_name="completion_records",
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        "identity.NexoraUser",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="verified_course_completions",
    )
    evidence_reference = models.CharField(max_length=160, blank=True)

    class Meta:
        db_table = "academic_course_completions"
        indexes = [
            models.Index(
                fields=("organization", "membership", "course", "status"),
                name="acad_completion_lookup_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Membership must belong to this organization."
        if self.course_id and self.course.organization_id != self.organization_id:
            errors["course"] = "Course must belong to this organization."
        if self.status == self.Status.VERIFIED and (not self.verified_at or not self.verified_by_id):
            errors["status"] = "Verified completion requires a verifier and verification timestamp."
        if errors:
            raise ValidationError(errors)
