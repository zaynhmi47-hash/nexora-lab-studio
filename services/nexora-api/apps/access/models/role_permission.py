from django.core.exceptions import ValidationError
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

    def clean(self):
        super().clean()
        if self.role_id and self.permission_id:
            role = self.role
            permission = self.permission
            if role.organization_id and permission.deleted_at is not None:
                raise ValidationError("Deleted permissions cannot be assigned to roles.")
            if role.is_system:
                from apps.access.services.provisioning import ROLE_PERMISSIONS

                allowed_codes = ROLE_PERMISSIONS.get(role.slug, set())
                if permission.code not in allowed_codes:
                    raise ValidationError("System roles cannot receive permissions outside their fixed policy.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def soft_delete(self):
        if self.role.is_system:
            raise ValidationError("Permissions cannot be removed from system roles.")
        return super().soft_delete()
