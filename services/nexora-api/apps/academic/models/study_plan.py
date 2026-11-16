from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class AcademicStudyPlan(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        REVISION = "revision", "Needs Revision"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        LOCKED = "locked", "Locked"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_study_plans")
    membership = models.ForeignKey("organizations.Membership", on_delete=models.PROTECT, related_name="academic_study_plans")
    term = models.ForeignKey("academic.AcademicTerm", on_delete=models.PROTECT, related_name="study_plans")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True)
    max_credit_units = models.PositiveSmallIntegerField(default=24, validators=[MinValueValidator(1), MaxValueValidator(60)])
    submitted_at = models.DateTimeField(null=True, blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey("identity.NexoraUser", null=True, blank=True, on_delete=models.PROTECT, related_name="decided_study_plans")
    advisor_note = models.TextField(blank=True)

    class Meta:
        db_table = "academic_study_plans"
        constraints = [
            models.UniqueConstraint(fields=("organization", "membership", "term"), condition=models.Q(deleted_at__isnull=True), name="academic_study_plan_member_term_unique"),
            models.CheckConstraint(condition=models.Q(max_credit_units__gte=1, max_credit_units__lte=60), name="academic_study_plan_credit_range"),
        ]
        indexes = [models.Index(fields=("organization", "term", "status"), name="acad_study_plan_status_idx")]

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        errors = {}
        if self.organization_id and self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Membership must belong to the study plan organization."
        if self.organization_id and self.term_id and self.term.organization_id != self.organization_id:
            errors["term"] = "Term must belong to the study plan organization."
        if self.membership_id and self.membership.status != "active":
            errors["membership"] = "Only active members can create a study plan."
        if errors:
            raise ValidationError(errors)


class AcademicStudyPlanItem(AuditableBaseModel):
    study_plan = models.ForeignKey(AcademicStudyPlan, on_delete=models.CASCADE, related_name="items")
    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="academic_study_plan_items")
    offering = models.ForeignKey("academic.AcademicCourseOffering", on_delete=models.PROTECT, related_name="study_plan_items")
    credit_units_snapshot = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])

    class Meta:
        db_table = "academic_study_plan_items"
        constraints = [
            models.UniqueConstraint(fields=("study_plan", "offering"), condition=models.Q(deleted_at__isnull=True), name="academic_study_plan_offering_unique"),
            models.CheckConstraint(condition=models.Q(credit_units_snapshot__gte=1, credit_units_snapshot__lte=12), name="academic_study_plan_item_credit_range"),
        ]

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        errors = {}
        if self.study_plan_id and self.organization_id != self.study_plan.organization_id:
            errors["organization"] = "Item organization must match the study plan."
        if self.offering_id:
            if self.offering.organization_id != self.organization_id:
                errors["offering"] = "Offering must belong to the study plan organization."
            if self.study_plan_id and self.offering.classroom.term_id != self.study_plan.term_id:
                errors["offering"] = "Offering must belong to the study plan term."
            if self.offering.status != "open":
                errors["offering"] = "Only open course offerings can be selected."
        if errors:
            raise ValidationError(errors)
