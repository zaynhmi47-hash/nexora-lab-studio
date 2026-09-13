from django.db import models

from apps.core.models import AuditableBaseModel


class RolePermission(AuditableBaseModel):
    role = models.ForeignKey("access.Role", on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey("access.Permission", on_delete=models.CASCADE, related_name="role_permissions")

    class Meta:
        db_table = "access_role_permissions"
        constraints = [
            models.UniqueConstraint(
                fields=("role", "permission"),
                name="access_role_permission_unique",
            )
        ]
        indexes = [models.Index(fields=("role",), name="access_rp_role_idx")]
