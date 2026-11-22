from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class CareerExperience(AuditableBaseModel):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"
        VOLUNTEER = "volunteer", "Volunteer"
        OTHER = "other", "Other"

    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="career_experiences")
    role_title = models.CharField(max_length=160)
    organization_name = models.CharField(max_length=180)
    employment_type = models.CharField(max_length=16, choices=EmploymentType.choices, default=EmploymentType.OTHER)
    location = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = "career_experiences"
        ordering = ("-start_date", "-created_at")
        indexes = [models.Index(fields=("user", "-start_date"), name="career_exp_user_start_idx")]

    def clean(self):
        super().clean()
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be earlier than start date."})
        if self.is_current and self.end_date:
            raise ValidationError({"end_date": "Current roles cannot have an end date."})


class CareerProject(AuditableBaseModel):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        ON_HOLD = "on_hold", "On hold"

    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        UNLISTED = "unlisted", "Unlisted"
        PUBLIC = "public", "Public"

    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="career_projects")
    title = models.CharField(max_length=180)
    summary = models.TextField(blank=True)
    role = models.CharField(max_length=120, blank=True)
    skills = models.JSONField(default=list, blank=True)
    artifact_url = models.URLField(max_length=1000, blank=True)
    started_at = models.DateField(null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PLANNING)
    visibility = models.CharField(max_length=12, choices=Visibility.choices, default=Visibility.PRIVATE)

    class Meta:
        db_table = "career_projects"
        ordering = ("-updated_at", "-created_at")
        indexes = [models.Index(fields=("user", "status"), name="career_project_user_status_idx")]

    def clean(self):
        super().clean()
        if not isinstance(self.skills, list) or any(
            not isinstance(item, str) or not item.strip() for item in self.skills
        ):
            raise ValidationError({"skills": "Skills must be a list of non-empty strings."})
        if self.started_at and self.completed_at and self.completed_at < self.started_at:
            raise ValidationError({"completed_at": "Completion date cannot precede the start date."})
        if self.status == self.Status.COMPLETED and not self.completed_at:
            raise ValidationError({"completed_at": "Completed projects require a completion date."})
