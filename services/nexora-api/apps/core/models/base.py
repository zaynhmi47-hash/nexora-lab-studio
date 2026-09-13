from __future__ import annotations

import uuid
from typing import Self

from django.db import models
from django.utils import timezone

from apps.core.models.managers import SoftDeleteManager


class UUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    def soft_delete(self) -> Self:
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])
        return self

    def restore(self) -> Self:
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])
        return self

    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    class Meta:
        abstract = True


class AuditableBaseModel(UUIDModel, TimestampedModel, SoftDeleteModel):
    objects = SoftDeleteManager()

    class Meta:
        abstract = True
