import uuid

from django.db import models
from django.utils import timezone


class AcademicAuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("organizations.Organization", on_delete=models.PROTECT, related_name="academic_audit_events")
    actor = models.ForeignKey("identity.NexoraUser", on_delete=models.PROTECT, related_name="academic_audit_events")
    action = models.CharField(max_length=32)
    resource_type = models.CharField(max_length=32)
    resource_id = models.UUIDField()
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)
    changes = models.JSONField(default=dict)

    class Meta:
        db_table = "academic_audit_events"
        ordering = ("-occurred_at", "-id")
        indexes = [models.Index(fields=("organization", "-occurred_at"), name="acad_audit_org_time_idx")]

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise RuntimeError("Academic audit events are immutable.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Academic audit events cannot be deleted.")
