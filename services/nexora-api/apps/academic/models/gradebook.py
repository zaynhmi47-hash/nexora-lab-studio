from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicGradingPolicy(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        LOCKED = "locked", "Locked"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_grading_policies")
    offering = models.OneToOneField("academic.AcademicCourseOffering", on_delete=models.PROTECT, related_name="grading_policy")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])

    class Meta:
        db_table = "academic_grading_policies"
        indexes = [models.Index(fields=("organization", "status"), name="acad_grade_policy_status_idx")]

    def clean(self):
        super().clean()
        if self.offering_id and self.offering.organization_id != self.organization_id:
            raise ValidationError({"offering": "Offering must belong to the grading policy organization."})
        if self.passing_score is not None and not (0 <= self.passing_score <= 100):
            raise ValidationError({"passing_score": "Passing score must be between 0 and 100."})


class AcademicAssessmentComponent(AuditableBaseModel):
    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_assessment_components")
    policy = models.ForeignKey(AcademicGradingPolicy, on_delete=models.CASCADE, related_name="components")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=120)
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.01), MaxValueValidator(100)])
    max_score = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)])
    sequence = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "academic_assessment_components"
        ordering = ("sequence", "code")
        constraints = [
            models.UniqueConstraint(fields=("policy", "code"), condition=models.Q(deleted_at__isnull=True), name="academic_assessment_policy_code_unique"),
            models.CheckConstraint(condition=models.Q(weight_percent__gt=0, weight_percent__lte=100), name="academic_assessment_weight_range"),
            models.CheckConstraint(condition=models.Q(max_score__gt=0), name="academic_assessment_max_score_positive"),
        ]
        indexes = [models.Index(fields=("organization", "policy", "is_active"), name="acad_assessment_policy_idx")]

    def clean(self):
        super().clean()
        if self.policy_id and self.policy.organization_id != self.organization_id:
            raise ValidationError({"policy": "Policy must belong to this organization."})


class AcademicGradeEntry(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_grade_entries")
    offering = models.ForeignKey("academic.AcademicCourseOffering", on_delete=models.PROTECT, related_name="grade_entries")
    component = models.ForeignKey(AcademicAssessmentComponent, on_delete=models.PROTECT, related_name="grade_entries")
    membership = models.ForeignKey("organizations.Membership", on_delete=models.PROTECT, related_name="academic_grade_entries")
    score = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    feedback = models.TextField(blank=True)
    revision = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    recorded_by = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="recorded_academic_grades")
    published_by = models.ForeignKey("identity.NexoraUser", null=True, blank=True, on_delete=models.PROTECT, related_name="published_academic_grades")
    published_at = models.DateTimeField(null=True, blank=True)
    supersedes = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT, related_name="revisions")

    class Meta:
        db_table = "academic_grade_entries"
        constraints = [
            models.UniqueConstraint(fields=("component", "membership", "revision"), name="academic_grade_revision_unique"),
            models.CheckConstraint(condition=models.Q(revision__gte=1), name="academic_grade_revision_positive"),
        ]
        indexes = [
            models.Index(fields=("organization", "offering", "membership"), name="acad_grade_roster_idx"),
            models.Index(fields=("component", "status"), name="acad_grade_component_status_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.offering_id and self.offering.organization_id != self.organization_id:
            errors["offering"] = "Offering must belong to this organization."
        if self.component_id:
            if self.component.organization_id != self.organization_id:
                errors["component"] = "Component must belong to this organization."
            if self.component.policy.offering_id != self.offering_id:
                errors["component"] = "Component must belong to this offering."
            if self.score is not None and self.score > self.component.max_score:
                errors["score"] = "Score cannot exceed the component maximum."
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Student membership must belong to this organization."
        if self.status == self.Status.PUBLISHED and (not self.published_at or not self.published_by_id):
            errors["status"] = "Published grades require a publisher and publication timestamp."
        if errors:
            raise ValidationError(errors)


class AcademicFinalGrade(AuditableBaseModel):
    class Status(models.TextChoices):
        PUBLISHED = "published", "Published"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_final_grades")
    offering = models.ForeignKey("academic.AcademicCourseOffering", on_delete=models.PROTECT, related_name="final_grades")
    membership = models.ForeignKey("organizations.Membership", on_delete=models.PROTECT, related_name="academic_final_grades")
    weighted_score = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    is_pass = models.BooleanField(null=True, blank=True)
    revision = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PUBLISHED)
    published_by = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="published_final_grades")
    published_at = models.DateTimeField()
    supersedes = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT, related_name="revisions")

    class Meta:
        db_table = "academic_final_grades"
        constraints = [models.UniqueConstraint(fields=("offering", "membership", "revision"), name="academic_final_grade_revision_unique")]
        indexes = [models.Index(fields=("organization", "membership", "published_at"), name="acad_final_grade_student_idx")]

    def clean(self):
        super().clean()
        if self.offering_id and self.offering.organization_id != self.organization_id:
            raise ValidationError({"offering": "Offering must belong to this organization."})
        if self.membership_id and self.membership.organization_id != self.organization_id:
            raise ValidationError({"membership": "Student membership must belong to this organization."})
