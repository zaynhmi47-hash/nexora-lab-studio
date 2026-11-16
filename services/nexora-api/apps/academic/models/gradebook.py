from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class AcademicGradingPolicy(AuditableBaseModel):
    """Versionable grading policy attached to one course offering."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_grading_policies",
    )
    offering = models.OneToOneField(
        "academic.AcademicCourseOffering",
        on_delete=models.PROTECT,
        related_name="grading_policy",
    )
    max_score = models.DecimalField(max_digits=7, decimal_places=2, default=100)
    passing_score = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        help_text="No pass/fail decision is possible until this threshold is configured.",
    )
    version = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "academic_grading_policies"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "offering", "version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_grade_policy_version_unique",
            ),
            models.CheckConstraint(
                condition=Q(max_score__gt=0),
                name="acad_grade_policy_max_positive",
            ),
            models.CheckConstraint(
                condition=Q(passing_score__isnull=True) | (
                    Q(passing_score__gte=0) & Q(passing_score__lte=models.F("max_score"))
                ),
                name="acad_grade_policy_pass_range",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.offering_id and self.offering.organization_id != self.organization_id:
            errors["offering"] = "Offering must belong to the grading policy organization."
        if self.max_score is not None and self.max_score <= 0:
            errors["max_score"] = "Maximum score must be greater than zero."
        if self.passing_score is not None and (
            self.passing_score < 0 or self.passing_score > self.max_score
        ):
            errors["passing_score"] = "Passing score must be between zero and maximum score."
        if errors:
            raise ValidationError(errors)


class AcademicAssessmentComponent(AuditableBaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_assessment_components",
    )
    offering = models.ForeignKey(
        "academic.AcademicCourseOffering",
        on_delete=models.PROTECT,
        related_name="assessment_components",
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    weight_percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(100)],
    )
    max_score = models.DecimalField(max_digits=7, decimal_places=2, default=100)
    is_required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True, db_index=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "academic_assessment_components"
        ordering = ("position", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "offering", "name"),
                condition=Q(deleted_at__isnull=True),
                name="acad_assessment_name_unique",
            ),
            models.CheckConstraint(
                condition=Q(weight_percent__gt=0, weight_percent__lte=100),
                name="acad_assessment_weight_range",
            ),
            models.CheckConstraint(
                condition=Q(max_score__gt=0),
                name="acad_assessment_max_score_positive",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "offering", "is_active"), name="acad_assessment_offer_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.offering_id and self.offering.organization_id != self.organization_id:
            errors["offering"] = "Offering must belong to the assessment organization."
        if self.max_score is not None and self.max_score <= 0:
            errors["max_score"] = "Maximum score must be greater than zero."
        if errors:
            raise ValidationError(errors)


class AcademicGradeEntry(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_grade_entries",
    )
    offering = models.ForeignKey(
        "academic.AcademicCourseOffering",
        on_delete=models.PROTECT,
        related_name="grade_entries",
    )
    component = models.ForeignKey(
        AcademicAssessmentComponent,
        on_delete=models.PROTECT,
        related_name="grade_entries",
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="academic_grade_entries",
    )
    score = models.DecimalField(max_digits=7, decimal_places=2)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    graded_by = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.PROTECT,
        related_name="academic_grade_entries",
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "academic_grade_entries"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "component", "membership"),
                condition=Q(deleted_at__isnull=True),
                name="acad_grade_entry_component_member_unique",
            ),
            models.CheckConstraint(condition=Q(score__gte=0), name="acad_grade_entry_score_nonnegative"),
        ]
        indexes = [
            models.Index(fields=("organization", "offering", "status"), name="acad_grade_offer_status_idx"),
            models.Index(fields=("membership", "status"), name="acad_grade_member_status_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.offering_id and self.offering.organization_id != self.organization_id:
            errors["offering"] = "Offering must belong to the grade entry organization."
        if self.component_id:
            if self.component.organization_id != self.organization_id:
                errors["component"] = "Assessment component must belong to this organization."
            if self.component.offering_id != self.offering_id:
                errors["component"] = "Assessment component must belong to this offering."
            if self.score is not None and self.score > self.component.max_score:
                errors["score"] = "Score cannot exceed the component maximum."
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Student membership must belong to this organization."
        if self.status == self.Status.PUBLISHED and not self.published_at:
            errors["published_at"] = "Published grade entries require a publication timestamp."
        if errors:
            raise ValidationError(errors)


class AcademicFinalGrade(AuditableBaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PUBLISHED = "published", "Published"

    class Outcome(models.TextChoices):
        PENDING_POLICY = "pending_policy", "Passing policy not configured"
        PASSED = "passed", "Passed"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_final_grades",
    )
    offering = models.ForeignKey(
        "academic.AcademicCourseOffering",
        on_delete=models.PROTECT,
        related_name="final_grades",
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="academic_final_grades",
    )
    final_score = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    outcome = models.CharField(
        max_length=20, choices=Outcome.choices, default=Outcome.PENDING_POLICY,
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "identity.NexoraUser",
        null=True, blank=True,
        on_delete=models.PROTECT,
        related_name="published_academic_final_grades",
    )

    class Meta:
        db_table = "academic_final_grades"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "offering", "membership"),
                condition=Q(deleted_at__isnull=True),
                name="acad_final_grade_offering_member_unique",
            ),
            models.CheckConstraint(
                condition=Q(final_score__isnull=True) | Q(final_score__gte=0),
                name="acad_final_grade_score_nonnegative",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "offering", "status"), name="acad_final_offer_status_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.offering_id and self.offering.organization_id != self.organization_id:
            errors["offering"] = "Offering must belong to this organization."
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Membership must belong to this organization."
        if self.status == self.Status.PUBLISHED and (not self.published_at or not self.published_by_id):
            errors["status"] = "Published final grades require publisher and timestamp."
        if errors:
            raise ValidationError(errors)


class AcademicGradeRevision(AuditableBaseModel):
    """Immutable-by-convention snapshot retained whenever a published grade changes."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_grade_revisions",
    )
    final_grade = models.ForeignKey(
        AcademicFinalGrade,
        on_delete=models.PROTECT,
        related_name="revisions",
    )
    revision_number = models.PositiveSmallIntegerField()
    previous_score = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    new_score = models.DecimalField(max_digits=7, decimal_places=2)
    reason = models.TextField()
    changed_by = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.PROTECT,
        related_name="academic_grade_revisions",
    )

    class Meta:
        db_table = "academic_grade_revisions"
        constraints = [
            models.UniqueConstraint(
                fields=("final_grade", "revision_number"),
                condition=Q(deleted_at__isnull=True),
                name="acad_grade_revision_number_unique",
            ),
        ]

    def clean(self):
        super().clean()
        if self.final_grade_id and self.final_grade.organization_id != self.organization_id:
            raise ValidationError({"final_grade": "Revision must belong to the final grade organization."})
