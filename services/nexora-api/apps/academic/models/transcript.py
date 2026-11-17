from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class AcademicTranscript(AuditableBaseModel):
    class Status(models.TextChoices):
        ISSUED = "issued", "Issued"
        REVOKED = "revoked", "Revoked"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="academic_transcripts",
    )
    membership = models.ForeignKey(
        "organizations.Membership", on_delete=models.PROTECT,
        related_name="academic_transcripts",
    )
    program = models.ForeignKey(
        "academic.AcademicProgram", on_delete=models.PROTECT,
        related_name="transcripts",
    )
    transcript_number = models.CharField(max_length=64)
    version = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ISSUED, db_index=True)
    snapshot = models.JSONField()
    snapshot_checksum = models.CharField(max_length=64)
    issued_at = models.DateTimeField()
    issued_by = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT,
        related_name="issued_academic_transcripts",
    )
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        "identity.NexoraUser", null=True, blank=True,
        on_delete=models.PROTECT, related_name="revoked_academic_transcripts",
    )
    revocation_reason = models.TextField(blank=True)

    class Meta:
        db_table = "academic_transcripts"
        ordering = ("-issued_at", "-version")
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "transcript_number"),
                condition=Q(deleted_at__isnull=True),
                name="acad_transcript_number_unique",
            ),
            models.UniqueConstraint(
                fields=("organization", "membership", "program", "version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_transcript_version_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "membership", "program", "-issued_at"),
                name="acad_transcript_member_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.membership_id and self.membership.organization_id != self.organization_id:
            errors["membership"] = "Membership must belong to the transcript organization."
        if self.program_id and self.program.organization_id != self.organization_id:
            errors["program"] = "Program must belong to the transcript organization."
        if self.status == self.Status.ISSUED and (
            self.revoked_at is not None or self.revoked_by_id is not None
        ):
            errors["status"] = "An issued transcript cannot contain revocation metadata."
        if self.status == self.Status.REVOKED and (
            self.revoked_at is None or self.revoked_by_id is None or not self.revocation_reason.strip()
        ):
            errors["status"] = "A revoked transcript requires actor, timestamp, and reason."
        if len(self.snapshot_checksum) != 64:
            errors["snapshot_checksum"] = "Transcript checksum must be a SHA-256 hex digest."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.pk:
            existing = type(self).objects.filter(pk=self.pk).first()
            if existing:
                immutable_fields = (
                    "organization_id", "membership_id", "program_id",
                    "transcript_number", "version", "snapshot",
                    "snapshot_checksum", "issued_at", "issued_by_id",
                )
                if any(getattr(existing, field) != getattr(self, field) for field in immutable_fields):
                    raise RuntimeError("Issued transcript snapshots are immutable.")
                if existing.status == self.Status.REVOKED and self.status != self.Status.REVOKED:
                    raise RuntimeError("A revoked transcript cannot be re-issued.")
                if existing.status == self.Status.ISSUED and self.status == self.Status.REVOKED:
                    if not self.revoked_at or not self.revoked_by_id or not self.revocation_reason.strip():
                        raise RuntimeError("Transcript revocation requires actor, timestamp, and reason.")
                elif any(
                    getattr(existing, field) != getattr(self, field)
                    for field in ("status", "revoked_at", "revoked_by_id", "revocation_reason")
                ):
                    raise RuntimeError("Transcript status can only change through the revocation workflow.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Issued transcripts cannot be deleted.")

    def soft_delete(self):
        raise RuntimeError("Issued transcripts cannot be archived.")
