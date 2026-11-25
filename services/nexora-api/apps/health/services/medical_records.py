from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.core.context import get_request_context
from apps.health.models import HealthAccessAuditEvent, HealthProfile, MedicalRecord
from apps.health.services.access import can_access_profile


RECORD_READ_SCOPE = "records.read"
RECORD_WRITE_SCOPE = "records.write"
AUDIT_POLICY_VERSION = "health-record-policy-v1"


def _audit(*, actor, profile, action, record):
    context = get_request_context()
    HealthAccessAuditEvent.objects.create(
        profile=profile,
        actor=actor,
        subject=profile.owner,
        grantee=actor,
        action=action,
        purpose="medical_record_management",
        scopes=[RECORD_READ_SCOPE if action == HealthAccessAuditEvent.Action.RECORD_READ else RECORD_WRITE_SCOPE],
        policy_version=AUDIT_POLICY_VERSION,
        correlation_id=context.correlation_id or "",
        details={"resource": "medical_record", "resource_id": str(record.pk)},
    )


def get_accessible_record(*, actor, profile_id, record_id, scope=RECORD_READ_SCOPE):
    record = MedicalRecord.objects.select_related("profile", "recorded_by").filter(
        pk=record_id,
        profile_id=profile_id,
        deleted_at__isnull=True,
        profile__deleted_at__isnull=True,
        profile__status=HealthProfile.Status.ACTIVE,
    ).first()
    if record is None or not can_access_profile(actor=actor, profile=record.profile, scope=scope):
        raise NotFound("Medical record is not available.")
    return record


def get_accessible_records(*, actor, profile):
    if not can_access_profile(actor=actor, profile=profile, scope=RECORD_READ_SCOPE):
        raise NotFound("Health profile is not available.")
    return MedicalRecord.objects.filter(profile=profile, deleted_at__isnull=True).select_related(
        "recorded_by",
    ).order_by("-occurred_at", "-created_at")


@transaction.atomic
def create_medical_record(*, actor, profile, **validated_data):
    if not can_access_profile(actor=actor, profile=profile, scope=RECORD_WRITE_SCOPE):
        raise PermissionDenied("Explicit records.write access is required.")
    record = MedicalRecord.objects.create(profile=profile, recorded_by=actor, **validated_data)
    _audit(actor=actor, profile=profile, action=HealthAccessAuditEvent.Action.RECORD_CREATED, record=record)
    return record


@transaction.atomic
def update_medical_record(*, actor, record, changes):
    if not can_access_profile(actor=actor, profile=record.profile, scope=RECORD_WRITE_SCOPE):
        raise PermissionDenied("Explicit records.write access is required.")
    for field, value in changes.items():
        setattr(record, field, value)
    record.save(update_fields=[*changes.keys(), "updated_at"])
    _audit(actor=actor, profile=record.profile, action=HealthAccessAuditEvent.Action.RECORD_UPDATED, record=record)
    return record


@transaction.atomic
def record_medical_record_read(*, actor, record):
    _audit(actor=actor, profile=record.profile, action=HealthAccessAuditEvent.Action.RECORD_READ, record=record)
