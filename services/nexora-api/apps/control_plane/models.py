from __future__ import annotations

from django.db import models

from apps.core.models import AuditableBaseModel


class ControlPlanePrincipal(AuditableBaseModel):
    """Explicit identity allowlist for the internal Nexora Control Center."""

    user = models.OneToOneField(
        "identity.NexoraUser",
        on_delete=models.CASCADE,
        related_name="control_plane_principal",
    )
    enabled = models.BooleanField(default=True, db_index=True)
    last_authenticated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "control_plane_principals"

    def __str__(self) -> str:
        return f"ControlPlanePrincipal<{self.user_id}>"
