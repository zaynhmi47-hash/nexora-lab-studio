from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class AcademicGpaPolicy(AuditableBaseModel):
    class RetakeStrategy(models.TextChoices):
        HIGHEST = "highest", "Highest grade points"
        LATEST = "latest", "Latest attempt"
        FIRST = "first", "First attempt"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="academic_gpa_policies",
    )
    grading_scale = models.ForeignKey(
        "academic.AcademicGradingScale", on_delete=models.PROTECT,
        related_name="gpa_policies",
    )
    version = models.PositiveSmallIntegerField()
    retake_strategy = models.CharField(
        max_length=12, choices=RetakeStrategy.choices,
        default=RetakeStrategy.HIGHEST,
    )
    include_failed_grades = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "academic_gpa_policies"
        ordering = ("-version",)
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_gpa_policy_org_version_unique",
            ),
            models.UniqueConstraint(
                fields=("organization",),
                condition=Q(deleted_at__isnull=True, is_active=True),
                name="acad_gpa_policy_active_unique",
            ),
        ]

    def clean(self):
        super().clean()
        if self.grading_scale_id and self.grading_scale.organization_id != self.organization_id:
            raise ValidationError({"grading_scale": "Grading scale must belong to this organization."})


class AcademicGpaCalculation(AuditableBaseModel):
    """Append-only snapshot of a term and cumulative GPA calculation."""

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="academic_gpa_calculations",
    )
    membership = models.ForeignKey(
        "organizations.Membership", on_delete=models.PROTECT,
        related_name="academic_gpa_calculations",
    )
    term = models.ForeignKey(
        "academic.AcademicTerm", on_delete=models.PROTECT,
        related_name="gpa_calculations",
    )
    policy = models.ForeignKey(
        AcademicGpaPolicy, on_delete=models.PROTECT,
        related_name="calculations",
    )
    calculation_version = models.PositiveSmallIntegerField()
    term_gpa = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    cumulative_gpa = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    term_attempted_credits = models.PositiveIntegerField(default=0)
    term_gpa_credits = models.PositiveIntegerField(default=0)
    term_earned_credits = models.PositiveIntegerField(default=0)
    cumulative_attempted_credits = models.PositiveIntegerField(default=0)
    cumulative_gpa_credits = models.PositiveIntegerField(default=0)
    cumulative_earned_credits = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict)
    calculated_at = models.DateTimeField()
    calculated_by = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT,
        related_name="academic_gpa_calculations",
    )

    class Meta:
        db_table = "academic_gpa_calculations"
        ordering = ("-calculated_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "membership", "term", "calculation_version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_gpa_calc_version_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "membership", "term", "-calculated_at"),
                name="acad_gpa_member_term_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Student membership must belong to this organization."
        if self.term_id and self.term.organization_id != self.organization_id:
            errors["term"] = "Academic term must belong to this organization."
        if self.policy_id and self.policy.organization_id != self.organization_id:
            errors["policy"] = "GPA policy must belong to this organization."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise RuntimeError("Published GPA calculation snapshots are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("GPA calculation snapshots cannot be deleted.")

    def soft_delete(self):
        raise RuntimeError("GPA calculation snapshots cannot be archived.")
