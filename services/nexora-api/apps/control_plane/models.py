from __future__ import annotations

from django.db import models

from apps.core.models import AuditableBaseModel


class ControlPlaneRole(models.TextChoices):
    OWNER = "owner", "Owner"
    PLATFORM_ADMIN = "platform_admin", "Platform Admin"
    SECURITY_ADMIN = "security_admin", "Security Admin"
    AUDITOR = "auditor", "Auditor"


class ControlPlanePermission(models.TextChoices):
    DASHBOARD_READ = "dashboard.read", "View dashboard"
    APPLICATIONS_READ = "applications.read", "View applications"
    SERVICES_READ = "services.read", "View services"
    USERS_READ = "users.read", "View users"
    SECURITY_READ = "security.read", "View security"
    SECURITY_MANAGE = "security.manage", "Manage security"
    AUDIT_READ = "audit.read", "View audit logs"
    OPERATIONS_MANAGE = "operations.manage", "Manage operations"
    CONFIGURATION_MANAGE = "configuration.manage", "Manage configuration"


ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    ControlPlaneRole.OWNER: frozenset(ControlPlanePermission.values),
    ControlPlaneRole.PLATFORM_ADMIN: frozenset({
        ControlPlanePermission.DASHBOARD_READ,
        ControlPlanePermission.APPLICATIONS_READ,
        ControlPlanePermission.SERVICES_READ,
        ControlPlanePermission.USERS_READ,
        ControlPlanePermission.OPERATIONS_MANAGE,
    }),
    ControlPlaneRole.SECURITY_ADMIN: frozenset({
        ControlPlanePermission.DASHBOARD_READ,
        ControlPlanePermission.USERS_READ,
        ControlPlanePermission.SECURITY_READ,
        ControlPlanePermission.SECURITY_MANAGE,
        ControlPlanePermission.AUDIT_READ,
    }),
    ControlPlaneRole.AUDITOR: frozenset({
        ControlPlanePermission.DASHBOARD_READ,
        ControlPlanePermission.APPLICATIONS_READ,
        ControlPlanePermission.SERVICES_READ,
        ControlPlanePermission.SECURITY_READ,
        ControlPlanePermission.AUDIT_READ,
    }),
}


class ControlPlanePrincipal(AuditableBaseModel):
    """Explicit identity and authorization boundary for the internal Control Center."""

    user = models.OneToOneField(
        "identity.NexoraUser",
        on_delete=models.CASCADE,
        related_name="control_plane_principal",
    )
    role = models.CharField(
        max_length=32,
        choices=ControlPlaneRole.choices,
        default=ControlPlaneRole.OWNER,
        db_index=True,
    )
    enabled = models.BooleanField(default=True, db_index=True)
    last_authenticated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "control_plane_principals"

    def __str__(self) -> str:
        return f"ControlPlanePrincipal<{self.user_id}>"

    def has_permission(self, permission: str) -> bool:
        if not self.enabled or self.deleted_at is not None:
            return False
        return permission in ROLE_PERMISSIONS.get(self.role, frozenset())


class ControlPlaneBootstrapState(models.Model):
    """Persistent one-time gate for first-owner bootstrap."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "control_plane_bootstrap_state"

    def __str__(self) -> str:
        return f"ControlPlaneBootstrapState<locked={self.locked}>"
