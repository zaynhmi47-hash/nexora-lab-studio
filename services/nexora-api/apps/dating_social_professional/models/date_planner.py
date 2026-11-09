from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

from .match import DatingMatch


class DatingDatePlan(AuditableBaseModel):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    class Activity(models.TextChoices):
        COFFEE = "coffee", "Coffee"
        FOOD = "food", "Food"
        WALK = "walk", "Walk"
        ART = "art", "Art and culture"
        MOVIE = "movie", "Movie"
        OUTDOOR = "outdoor", "Outdoor"
        OTHER = "other", "Other"

    match = models.ForeignKey(DatingMatch, on_delete=models.PROTECT, related_name="date_plans")
    organizer = models.ForeignKey(NexoraUser, on_delete=models.PROTECT, related_name="dating_plans_created")
    activity = models.CharField(max_length=16, choices=Activity.choices, default=Activity.OTHER)
    title = models.CharField(max_length=120)
    starts_at = models.DateTimeField()
    timezone_name = models.CharField(max_length=64, default="Asia/Jakarta")
    location_name = models.CharField(max_length=180)
    notes = models.CharField(max_length=1000, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PROPOSED, db_index=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_date_plans"
        indexes = [
            models.Index(fields=("match", "starts_at")),
            models.Index(fields=("status", "starts_at")),
        ]


class DatingRelationshipMilestone(AuditableBaseModel):
    class Stage(models.TextChoices):
        FIRST_HELLO = "first_hello", "First hello"
        GETTING_TO_KNOW = "getting_to_know", "Getting to know"
        FIRST_DATE = "first_date", "First date"
        BUILDING_TRUST = "building_trust", "Building trust"
        DEFINING_RELATIONSHIP = "defining_relationship", "Defining the relationship"

    match = models.ForeignKey(DatingMatch, on_delete=models.PROTECT, related_name="relationship_milestones")
    stage = models.CharField(max_length=32, choices=Stage.choices)
    acknowledged_by_a_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by_b_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dating_relationship_milestones"
        constraints = [
            models.UniqueConstraint(fields=("match", "stage"), name="dating_milestone_match_stage_unique"),
        ]
        indexes = [models.Index(fields=("match", "stage"))]
