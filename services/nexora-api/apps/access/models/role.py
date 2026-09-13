from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import AuditableBaseModel


class Role(AuditableBaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="roles",
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    permissions = models.ManyToManyField(
        "access.Permission",
        through="access.RolePermission",
        related_name="roles",
    )

    class Meta:
        db_table = "access_roles"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "slug"),
                condition=models.Q(deleted_at__isnull=True),
                name="access_role_active_slug_unique",
            )
        ]
        indexes = [models.Index(fields=("organization", "slug"), name="access_role_org_slug_idx")]

    def clean(self):
        if self.is_system and self.pk:
            previous = type(self).objects.filter(pk=self.pk).values("organization_id", "slug", "is_system").first()
            if previous and (
                previous["organization_id"] != self.organization_id
                or previous["slug"] != self.slug
                or not previous["is_system"]
            ):
                raise ValidationError("System role identity cannot be changed.")
        return super().clean()

    def soft_delete(self):
        if self.is_system:
            raise ValidationError("System roles cannot be deleted.")
        if self.memberships.active().exists():
            raise ValidationError("Roles assigned to active memberships cannot be deleted.")
        return super().soft_delete()

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.slug}"
