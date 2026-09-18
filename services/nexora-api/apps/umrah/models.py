from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class UmrahStage(AuditableBaseModel):
    key = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(unique=True)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "umrah_stages"
        ordering = ("sort_order",)


class UmrahChecklistItem(AuditableBaseModel):
    key = models.CharField(max_length=100, unique=True, db_index=True)
    stage = models.ForeignKey(UmrahStage, on_delete=models.PROTECT, related_name="checklist_items")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    required = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "umrah_checklist_items"
        ordering = ("stage", "sort_order")
        constraints = [
            models.UniqueConstraint(fields=("stage", "sort_order"), name="umrah_stage_item_order_unique"),
        ]


class UmrahChecklistProgress(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="umrah_checklist_progress")
    item = models.ForeignKey(UmrahChecklistItem, on_delete=models.PROTECT, related_name="user_progress")
    completed = models.BooleanField(default=False)

    class Meta:
        db_table = "umrah_checklist_progress"
        constraints = [
            models.UniqueConstraint(fields=("user", "item"), name="umrah_user_item_unique"),
        ]
