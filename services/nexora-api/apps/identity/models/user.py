from django.db import models

from apps.core.models import AuditableBaseModel


class NexoraUser(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        DISABLED = "disabled", "Disabled"
        PENDING = "pending", "Pending"
        DELETED = "deleted", "Deleted"

    email = models.EmailField(blank=True, null=True)
    display_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(max_length=2048, blank=True)
    phone_number = models.CharField(max_length=32, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    locale = models.CharField(max_length=16, default="en-US")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "identity_users"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return self.email or str(self.id)

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False
