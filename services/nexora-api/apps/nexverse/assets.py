from __future__ import annotations

from django.db import models

from apps.core.models import AuditableBaseModel


class NexverseUploadSession(AuditableBaseModel):
    class AssetType(models.TextChoices):
        MANUSCRIPT = "manuscript", "Manuscript"
        COVER = "cover", "Cover"
        ATTACHMENT = "attachment", "Attachment"

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        UPLOADED = "uploaded", "Uploaded"
        EXPIRED = "expired", "Expired"
        REJECTED = "rejected", "Rejected"

    work = models.ForeignKey(
        "nexverse.NexverseWork",
        on_delete=models.CASCADE,
        related_name="upload_sessions",
    )
    owner = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.PROTECT,
        related_name="nexverse_upload_sessions",
    )
    asset_type = models.CharField(max_length=16, choices=AssetType.choices)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=127)
    expected_size_bytes = models.PositiveBigIntegerField()
    storage_path = models.CharField(max_length=512, unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CREATED, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    uploaded_size_bytes = models.PositiveBigIntegerField(null=True, blank=True)
    checksum_md5 = models.CharField(max_length=64, blank=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexverse_upload_sessions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("owner", "status"), name="nex_upload_owner_status_idx"),
            models.Index(fields=("work", "asset_type"), name="nex_upload_work_type_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.asset_type}:{self.original_filename}"
