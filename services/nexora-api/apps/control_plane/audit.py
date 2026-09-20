from __future__ import annotations

from typing import Any

from django.db import models
from django.utils import timezone
import uuid

from apps.identity.models import NexoraUser


class ControlPlaneAuditEventType(models.TextChoices):
    LOGIN = "CONTROL_PLANE_LOGIN", "Control Center login"
    LOGIN_FAILED = "CONTROL_PLANE_LOGIN_FAILED", "Control Center login failed"
    PRINCIPAL_ROLE_CHANGED = "PRINCIPAL_ROLE_CHANGED", "Principal role changed"
    PRINCIPAL_ENABLED = "PRINCIPAL_ENABLED", "Principal enabled"
    PRINCIPAL_DISABLED = "PRINCIPAL_DISABLED", "Principal disabled"
    BOOTSTRAP_COMPLETED = "BOOTSTRAP_COMPLETED", "Bootstrap completed"
    BOOTSTRAP_REJECTED = "BOOTSTRAP_REJECTED", "Bootstrap rejected"


class ControlPlaneAuditEvent(models.Model):
    """Append-only security events for the internal Control Center."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=64, choices=ControlPlaneAuditEventType.choices, db_index=True)
    actor = models.ForeignKey(
        NexoraUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="control_plane_audit_events",
    )
    target = models.ForeignKey(
        NexoraUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="control_plane_audit_targets",
    )
    success = models.BooleanField(default=True)
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)
    correlation_id = models.CharField(max_length=128, blank=True, default="", db_index=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = "control_plane_audit_events"
        ordering = ("-occurred_at", "-id")
        indexes = [
            models.Index(fields=("event_type", "-occurred_at")),
            models.Index(fields=("actor", "-occurred_at")),
            models.Index(fields=("target", "-occurred_at")),
        ]


def _validate_audit_metadata(metadata: dict[str, Any] | None) -> dict[str, Any]:
    if metadata is None:
        return {}
    forbidden = {"token", "id_token", "authorization", "password", "secret", "credential", "credentials"}
    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if str(key).strip().lower() in forbidden:
                    raise ValueError("Sensitive credential fields are not allowed in audit metadata.")
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    if not isinstance(metadata, dict):
        raise TypeError("Audit metadata must be a dictionary.")
    walk(metadata)
    return metadata


def record_control_plane_audit(
    *,
    event_type: str,
    actor: NexoraUser | None = None,
    target: NexoraUser | None = None,
    success: bool = True,
    correlation_id: str = "",
    metadata: dict[str, Any] | None = None,
) -> ControlPlaneAuditEvent:
    """Write only safe, structured audit metadata; callers must never pass credentials."""
    return ControlPlaneAuditEvent.objects.create(
        event_type=event_type,
        actor=actor,
        target=target,
        success=success,
        correlation_id=correlation_id[:128],
        metadata=_validate_audit_metadata(metadata),
    )
