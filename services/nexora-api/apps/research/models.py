from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class ResearchProject(AuditableBaseModel):
    class Status(models.TextChoices):
        IDEA = "idea", "Idea"
        PROPOSAL = "proposal", "Proposal"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        ON_HOLD = "on_hold", "On hold"

    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        UNLISTED = "unlisted", "Unlisted"

    owner = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="research_projects")
    title = models.CharField(max_length=200)
    abstract = models.TextField(blank=True)
    research_question = models.TextField(blank=True)
    field_of_study = models.CharField(max_length=160, blank=True)
    methodology = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.IDEA)
    visibility = models.CharField(max_length=12, choices=Visibility.choices, default=Visibility.PRIVATE)
    started_at = models.DateField(null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "research_projects"
        ordering = ("-updated_at", "-created_at")
        indexes = [models.Index(fields=("owner", "status"), name="research_owner_status_idx")]

    def clean(self):
        super().clean()
        if self.started_at and self.completed_at and self.completed_at < self.started_at:
            raise ValidationError({"completed_at": "Completion date cannot precede the start date."})
        if self.status == self.Status.COMPLETED and not self.completed_at:
            raise ValidationError({"completed_at": "Completed research projects require a completion date."})


class ResearchContribution(AuditableBaseModel):
    class ContributionType(models.TextChoices):
        CONCEPTUALIZATION = "conceptualization", "Conceptualization"
        METHODOLOGY = "methodology", "Methodology"
        INVESTIGATION = "investigation", "Investigation"
        DATA_CURATION = "data_curation", "Data curation"
        ANALYSIS = "analysis", "Analysis"
        WRITING = "writing", "Writing"
        SUPERVISION = "supervision", "Supervision"
        OTHER = "other", "Other"

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name="contributions")
    contributor_name = models.CharField(max_length=180)
    affiliation = models.CharField(max_length=180, blank=True)
    role = models.CharField(max_length=120, blank=True)
    contribution_type = models.CharField(max_length=24, choices=ContributionType.choices, default=ContributionType.OTHER)
    statement = models.TextField(blank=True)
    is_corresponding_author = models.BooleanField(default=False)
    attribution_status = models.CharField(max_length=16, default="self_reported", editable=False)

    class Meta:
        db_table = "research_contributions"
        ordering = ("created_at",)
        indexes = [models.Index(fields=("project", "contribution_type"), name="research_contrib_type_idx")]


class ResearchOutput(AuditableBaseModel):
    class OutputType(models.TextChoices):
        ARTICLE = "article", "Article"
        PREPRINT = "preprint", "Preprint"
        THESIS = "thesis", "Thesis"
        DATASET = "dataset", "Dataset"
        SOFTWARE = "software", "Software"
        POSTER = "poster", "Poster"
        PRESENTATION = "presentation", "Presentation"
        REPORT = "report", "Report"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        ACCEPTED = "accepted", "Accepted"
        PUBLISHED = "published", "Published"
        WITHDRAWN = "withdrawn", "Withdrawn"

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name="outputs")
    title = models.CharField(max_length=220)
    output_type = models.CharField(max_length=20, choices=OutputType.choices, default=OutputType.OTHER)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    abstract = models.TextField(blank=True)
    doi = models.CharField(max_length=255, blank=True)
    resource_url = models.URLField(max_length=1000, blank=True)
    published_on = models.DateField(null=True, blank=True)
    provenance_status = models.CharField(max_length=16, default="self_reported", editable=False)

    class Meta:
        db_table = "research_outputs"
        ordering = ("-published_on", "-created_at")
        indexes = [models.Index(fields=("project", "status"), name="research_output_status_idx")]

    def clean(self):
        super().clean()
        if self.status == self.Status.PUBLISHED and not (self.published_on or self.doi or self.resource_url):
            raise ValidationError("Published outputs require a publication date, DOI or resource URL.")


class ResearchEvidenceVerification(AuditableBaseModel):
    """A consented, organization-scoped review of an owner-submitted research output."""

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        REVOKED = "revoked", "Revoked"

    output = models.ForeignKey(
        ResearchOutput, on_delete=models.PROTECT, related_name="verification_cases",
    )
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, related_name="research_verifications",
    )
    submitted_by = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, related_name="submitted_research_verifications",
    )
    reviewer = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, null=True, blank=True,
        related_name="reviewed_research_verifications",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUBMITTED, db_index=True)
    consented_at = models.DateTimeField()
    reviewed_at = models.DateTimeField(null=True, blank=True)
    decision_reason = models.TextField(blank=True)

    class Meta:
        db_table = "research_evidence_verifications"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("organization", "status"), name="research_verify_org_status_idx"),
            models.Index(fields=("output", "status"), name="research_verify_output_status_idx"),
        ]

    def clean(self):
        super().clean()
        if self.output_id and self.submitted_by_id and self.output.project.owner_id != self.submitted_by_id:
            raise ValidationError({"submitted_by": "Only the research output owner can submit it for verification."})
        if self.reviewer_id and self.reviewer_id == self.submitted_by_id:
            raise ValidationError({"reviewer": "The submitter cannot review their own evidence."})


class ResearchEvidenceVerificationEvent(AuditableBaseModel):
    """Append-only application-level audit record for verification state transitions."""

    verification = models.ForeignKey(
        ResearchEvidenceVerification, on_delete=models.PROTECT, related_name="events",
    )
    actor = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="research_verification_events")
    from_status = models.CharField(max_length=16, blank=True)
    to_status = models.CharField(max_length=16, choices=ResearchEvidenceVerification.Status.choices)
    reason = models.TextField(blank=True)

    class Meta:
        db_table = "research_evidence_verification_events"
        ordering = ("created_at",)
        indexes = [models.Index(fields=("verification", "created_at"), name="research_verify_event_idx")]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Verification audit events are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Verification audit events cannot be deleted.")

    def soft_delete(self):
        raise ValidationError("Verification audit events cannot be deleted.")
