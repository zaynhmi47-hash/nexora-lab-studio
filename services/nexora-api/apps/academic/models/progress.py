from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class AcademicProgramEnrollment(AuditableBaseModel):
    """Explicit student-to-program registration pinned to a curriculum version."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        WITHDRAWN = "withdrawn", "Withdrawn"
        COMPLETED = "completed", "Completed"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="academic_program_enrollments",
    )
    membership = models.ForeignKey(
        "organizations.Membership", on_delete=models.PROTECT,
        related_name="academic_program_enrollments",
    )
    program = models.ForeignKey(
        "academic.AcademicProgram", on_delete=models.PROTECT,
        related_name="student_enrollments",
    )
    curriculum_version = models.CharField(max_length=32)
    cohort_code = models.CharField(max_length=32, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    enrolled_at = models.DateField()
    expected_graduation_on = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "academic_program_enrollments"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "membership", "program"),
                condition=Q(deleted_at__isnull=True, status="active"),
                name="acad_program_enroll_active_unique",
            ),
            models.CheckConstraint(
                condition=Q(expected_graduation_on__isnull=True)
                | Q(expected_graduation_on__gte=models.F("enrolled_at")),
                name="acad_program_expected_grad_after_enroll",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "program", "status"), name="acad_prog_enroll_lookup_idx"),
            models.Index(fields=("membership", "status"), name="acad_prog_enroll_member_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Membership must belong to this organization."
        if self.program_id and self.program.organization_id != self.organization_id:
            errors["program"] = "Program must belong to this organization."
        if self.membership_id and self.membership.status != "active":
            errors["membership"] = "Only active organization members may enroll in a program."
        if self.expected_graduation_on and self.expected_graduation_on < self.enrolled_at:
            errors["expected_graduation_on"] = "Expected graduation cannot precede enrollment."
        if errors:
            raise ValidationError(errors)


class AcademicProgressSnapshot(AuditableBaseModel):
    """Immutable, versioned record of a student's progress projection."""

    enrollment = models.ForeignKey(
        AcademicProgramEnrollment, on_delete=models.PROTECT,
        related_name="progress_snapshots",
    )
    version = models.PositiveIntegerField()
    snapshot = models.JSONField()
    snapshot_checksum = models.CharField(max_length=64)
    generated_at = models.DateTimeField()
    generated_by = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT,
        related_name="generated_academic_progress_snapshots",
    )

    class Meta:
        db_table = "academic_progress_snapshots"
        ordering = ("-version",)
        constraints = [
            models.UniqueConstraint(
                fields=("enrollment", "version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_progress_snapshot_version_unique",
            ),
        ]
        indexes = [
            models.Index(fields=("enrollment", "-generated_at"), name="acad_progress_enroll_idx"),
        ]

    def clean(self):
        super().clean()
        if len(self.snapshot_checksum) != 64:
            raise ValidationError({"snapshot_checksum": "Checksum must be a SHA-256 digest."})

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise RuntimeError("Academic progress snapshots are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Academic progress snapshots cannot be deleted.")

    def soft_delete(self):
        raise RuntimeError("Academic progress snapshots cannot be archived.")
