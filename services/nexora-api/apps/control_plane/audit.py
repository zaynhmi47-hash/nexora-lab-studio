from __future__ import annotations

import json
import re
import uuid
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.context import get_request_context
from apps.identity.models import NexoraUser

MAX_AUDIT_METADATA_BYTES = 8192
MAX_AUDIT_METADATA_DEPTH = 8
MAX_AUDIT_METADATA_ITEMS = 100
MAX_AUDIT_METADATA_STRING = 2048
MAX_AUDIT_CORRELATION_ID = 128
SENSITIVE_AUDIT_KEY_TERMS = frozenset(
    {"token", "authorization", "password", "secret", "credential", "privatekey", "apikey"}
)


class ControlPlaneAuditEventType(models.TextChoices):
    LOGIN = "CONTROL_PLANE_LOGIN", "Control Center login"
    LOGIN_FAILED = "CONTROL_PLANE_LOGIN_FAILED", "Control Center login failed"
    PRINCIPAL_ROLE_CHANGED = "PRINCIPAL_ROLE_CHANGED", "Principal role changed"
    PRINCIPAL_ENABLED = "PRINCIPAL_ENABLED", "Principal enabled"
    PRINCIPAL_DISABLED = "PRINCIPAL_DISABLED", "Principal disabled"
    BOOTSTRAP_COMPLETED = "BOOTSTRAP_COMPLETED", "Bootstrap completed"
    BOOTSTRAP_REJECTED = "BOOTSTRAP_REJECTED", "Bootstrap rejected"
    TELEMETRY_CLEARED = "TELEMETRY_CLEARED", "Request telemetry cleared"


class ControlPlaneAuditEvent(models.Model):
    """Append-only security events for the internal Control Center."""

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise RuntimeError("Control Plane audit events are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Control Plane audit events cannot be deleted.")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=64, choices=ControlPlaneAuditEventType.choices, db_index=True)
    actor = models.ForeignKey(NexoraUser, null=True, blank=True, on_delete=models.PROTECT, related_name="control_plane_audit_events")
    target = models.ForeignKey(NexoraUser, null=True, blank=True, on_delete=models.PROTECT, related_name="control_plane_audit_targets")
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
    if not isinstance(metadata, dict):
        raise TypeError("Audit metadata must be a dictionary.")

    def walk(value: Any, depth: int = 0) -> None:
        if depth > MAX_AUDIT_METADATA_DEPTH:
            raise ValueError("Audit metadata nesting is too deep.")
        if isinstance(value, dict):
            if len(value) > MAX_AUDIT_METADATA_ITEMS:
                raise ValueError("Audit metadata contains too many fields.")
            for key, child in value.items():
                normalized = re.sub(r"[^a-z0-9]", "", str(key).strip().lower())
                if any(term in normalized for term in SENSITIVE_AUDIT_KEY_TERMS):
                    raise ValueError("Sensitive credential fields are not allowed in audit metadata.")
                if len(str(key)) > 128:
                    raise ValueError("Audit metadata keys are too long.")
                walk(child, depth + 1)
        elif isinstance(value, list):
            if len(value) > MAX_AUDIT_METADATA_ITEMS:
                raise ValueError("Audit metadata lists are too large.")
            for child in value:
                walk(child, depth + 1)
        elif isinstance(value, str) and len(value) > MAX_AUDIT_METADATA_STRING:
            raise ValueError("Audit metadata strings are too long.")
        elif value is not None and not isinstance(value, (bool, int, float)):
            raise TypeError("Audit metadata contains an unsupported value type.")

    walk(metadata)
    try:
        encoded = json.dumps(metadata, ensure_ascii=False, separators=(",", ":"))
    except (TypeError, ValueError) as exc:
        raise TypeError("Audit metadata must be JSON serializable.") from exc
    if len(encoded.encode("utf-8")) > MAX_AUDIT_METADATA_BYTES:
        raise ValueError("Audit metadata exceeds the maximum size.")
    return metadata


def normalize_audit_correlation_id(value: str | None) -> str:
    if value is None:
        return ""
    normalized = str(value).strip()
    if len(normalized) > MAX_AUDIT_CORRELATION_ID:
        raise ValueError("Audit correlation ID is too long.")
    return normalized


def record_control_plane_audit(
    *,
    event_type: str,
    actor: NexoraUser | None = None,
    target: NexoraUser | None = None,
    success: bool = True,
    correlation_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> ControlPlaneAuditEvent:
    """Write only safe, structured audit metadata; callers must never pass credentials."""
    if event_type not in ControlPlaneAuditEventType.values:
        raise ValueError("Unknown Control Plane audit event type.")
    resolved_correlation_id = correlation_id
    if resolved_correlation_id is None:
        resolved_correlation_id = get_request_context().correlation_id or ""
    resolved_correlation_id = normalize_audit_correlation_id(resolved_correlation_id)
    safe_metadata = _validate_audit_metadata(metadata)
    return ControlPlaneAuditEvent.objects.create(
        event_type=event_type,
        actor=actor,
        target=target,
        success=success,
        correlation_id=resolved_correlation_id,
        metadata=safe_metadata,
    )


def audit_retention_days() -> int:
    value = int(getattr(settings, "CONTROL_PLANE_AUDIT_RETENTION_DAYS", 0))
    if value < 0:
        raise ValueError("CONTROL_PLANE_AUDIT_RETENTION_DAYS cannot be negative.")
    return value


def audit_retention_cutoff(*, now=None):
    if now is None:
        now = timezone.now()
    days = audit_retention_days()
    if days == 0:
        return None
    return now - timedelta(days=days)
