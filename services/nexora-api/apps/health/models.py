from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class HealthProfile(AuditableBaseModel):
    """A health-data boundary; deliberately distinct from a Nexora account."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    owner = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.PROTECT,
        related_name="owned_health_profiles",
    )
    display_name = models.CharField(max_length=120)
    date_of_birth = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        db_table = "health_profiles"
        ordering = ("created_at",)
        indexes = [models.Index(fields=("owner", "status"))]

    def __str__(self):
        return self.display_name


class HealthProfileMember(AuditableBaseModel):
    """Explicit delegation; family relationship alone never creates access."""

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        CAREGIVER = "caregiver", "Caregiver"
        CLINICIAN = "clinician", "Clinician"
        VIEWER = "viewer", "Viewer"

    profile = models.ForeignKey(HealthProfile, on_delete=models.PROTECT, related_name="members")
    user = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="health_memberships")
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.VIEWER)
    scopes = models.JSONField(default=list, blank=True)
    granted_by = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT, related_name="health_access_grants_issued"
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "health_profile_members"
        constraints = [
            models.UniqueConstraint(fields=("profile", "user"), condition=Q(deleted_at__isnull=True), name="uq_health_profile_member"),
        ]
        indexes = [models.Index(fields=("user", "revoked_at"))]


class HealthConsent(AuditableBaseModel):
    """Versioned, purpose-specific consent; revocation is retained as history."""

    class Status(models.TextChoices):
        GRANTED = "granted", "Granted"
        REVOKED = "revoked", "Revoked"
        EXPIRED = "expired", "Expired"

    profile = models.ForeignKey(HealthProfile, on_delete=models.PROTECT, related_name="consents")
    subject = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT, related_name="health_consents_as_subject"
    )
    grantee = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT, related_name="health_consents_as_grantee"
    )
    purpose = models.CharField(max_length=80)
    scopes = models.JSONField(default=list)
    policy_version = models.CharField(max_length=32)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.GRANTED)
    granted_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "health_consents"
        indexes = [
            models.Index(fields=("profile", "grantee", "status")),
            models.Index(fields=("subject", "purpose", "status")),
        ]
