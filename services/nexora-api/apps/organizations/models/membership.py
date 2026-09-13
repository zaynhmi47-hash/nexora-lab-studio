from django.db import models

from apps.core.models import AuditableBaseModel


class Membership(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        REVOKED = "revoked", "Revoked"

    user = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.ForeignKey(
        "access.Role",
        on_delete=models.PROTECT,
        related_name="memberships",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self):
        super().clean()
        if self.role_id and self.organization_id and self.role.organization_id != self.organization_id:
            from django.core.exceptions import ValidationError

            raise ValidationError({"role": "Membership roles must belong to the membership organization."})

    class Meta:
        db_table = "organization_memberships"
        constraints = [
            models.UniqueConstraint(
                fields=("user", "organization"),
                condition=models.Q(deleted_at__isnull=True),
                name="membership_active_pair_unique",
            )
        ]
        indexes = [
            models.Index(fields=("organization", "status"), name="membership_org_status_idx"),
            models.Index(fields=("user", "status"), name="membership_user_status_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.organization_id}"
