from django.db import models

from apps.core.models import AuditableBaseModel


class IdentityDevice(AuditableBaseModel):
    class Platform(models.TextChoices):
        ANDROID = "android", "Android"
        IOS = "ios", "iOS"
        WEB = "web", "Web"
        DESKTOP = "desktop", "Desktop"
        OTHER = "other", "Other"

    user = models.ForeignKey("identity.NexoraUser", on_delete=models.CASCADE, related_name="devices")
    fingerprint_hash = models.CharField(max_length=64)
    display_name = models.CharField(max_length=80, blank=True)
    platform = models.CharField(max_length=16, choices=Platform.choices, default=Platform.OTHER)
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    trusted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "identity_devices"
        constraints = [
            models.UniqueConstraint(fields=("user", "fingerprint_hash"), name="identity_device_fingerprint_unique")
        ]
        indexes = [models.Index(fields=("user", "last_seen_at"), name="identity_device_user_seen_idx")]


class IdentityLoginEvent(AuditableBaseModel):
    class Type(models.TextChoices):
        LOGIN_VERIFIED = "login_verified", "Login verified"
        DEVICE_REGISTERED = "device_registered", "Device registered"
        DEVICE_SEEN = "device_seen", "Device seen"
        DEVICE_TRUSTED = "device_trusted", "Device trusted"
        DEVICE_REVOKED = "device_revoked", "Device revoked"
        ALL_SESSIONS_REVOKED = "all_sessions_revoked", "All sessions revoked"

    user = models.ForeignKey("identity.NexoraUser", on_delete=models.CASCADE, related_name="login_events")
    device = models.ForeignKey(
        IdentityDevice, on_delete=models.SET_NULL, related_name="login_events", null=True, blank=True
    )
    event_type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    occurred_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "identity_login_events"
        indexes = [models.Index(fields=("user", "occurred_at"), name="identity_login_user_time_idx")]
        ordering = ("-occurred_at",)
