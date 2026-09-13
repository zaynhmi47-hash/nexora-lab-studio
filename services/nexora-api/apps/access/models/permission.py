from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import AuditableBaseModel


class Permission(AuditableBaseModel):
    code = models.CharField(
        max_length=100,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$",
                message="Permission codes must be lowercase dot-separated identifiers.",
            )
        ],
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=64, blank=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        db_table = "access_permissions"
        ordering = ("code",)
        indexes = [models.Index(fields=("category",), name="access_perm_category_idx")]

    def clean(self):
        super().clean()
        if self.is_system and self.pk:
            previous = type(self).objects.filter(pk=self.pk).values("code", "is_system").first()
            if previous and (previous["code"] != self.code or not previous["is_system"]):
                raise ValidationError("System permission identity cannot be changed.")

    def soft_delete(self):
        if self.is_system:
            raise ValidationError("System permissions cannot be deleted.")
        return super().soft_delete()

    def __str__(self) -> str:
        return self.code
