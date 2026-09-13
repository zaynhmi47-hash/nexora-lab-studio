from django.db import models

from apps.core.models import AuditableBaseModel


class IdentityProviderAccount(AuditableBaseModel):
    user = models.ForeignKey("identity.NexoraUser", on_delete=models.CASCADE, related_name="provider_accounts")
    provider = models.CharField(max_length=64)
    provider_subject = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    display_name = models.CharField(max_length=255, blank=True)
    claims = models.JSONField(default=dict, blank=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "identity_provider_accounts"
        constraints = [models.UniqueConstraint(fields=("provider", "provider_subject"), name="identity_provider_subject_unique")]
        indexes = [models.Index(fields=("user", "provider"), name="identity_acct_user_prov_idx")]

    def __str__(self) -> str:
        return f"{self.provider}:{self.provider_subject}"
