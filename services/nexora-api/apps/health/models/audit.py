from django.db import models

from apps.core.models import TimestampedModel, UUIDModel


class ImmutableAuditQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise ValueError("Health access audit events are immutable.")

    def delete(self):
        raise ValueError("Health access audit events cannot be deleted.")


class HealthAccessAuditEvent(UUIDModel, TimestampedModel):
    """Append-only record of health-profile access delegation changes."""

    class Action(models.TextChoices):
        ACCESS_GRANTED = "access.granted", "Access granted"
        ACCESS_REVOKED = "access.revoked", "Access revoked"
        PROFILE_READ = "profile.read", "Profile read"

    objects = ImmutableAuditQuerySet.as_manager()

    profile = models.ForeignKey("health.HealthProfile", on_delete=models.PROTECT, related_name="access_audit_events")
    actor = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="health_access_audit_actions")
    subject = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="health_access_audit_subject_events")
    grantee = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="health_access_audit_grantee_events")
    action = models.CharField(max_length=24, choices=Action.choices)
    purpose = models.CharField(max_length=80)
    scopes = models.JSONField(default=list)
    policy_version = models.CharField(max_length=32)
    correlation_id = models.CharField(max_length=128, blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "health_access_audit_events"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("profile", "created_at"), name="health_audit_profile_time_idx"),
            models.Index(fields=("actor", "created_at"), name="health_audit_actor_time_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("Health access audit events are append-only.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Health access audit events cannot be deleted.")
