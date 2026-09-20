import pytest
from django.db import DatabaseError

from apps.control_plane.audit import ControlPlaneAuditEvent, ControlPlaneAuditEventType, record_control_plane_audit
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_audit_event_is_immutable_through_model_save():
    event = record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN)
    event.success = False
    with pytest.raises(RuntimeError, match="immutable"):
        event.save()


@pytest.mark.django_db
def test_audit_event_cannot_be_deleted_through_model_api():
    event = record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN)
    with pytest.raises(RuntimeError, match="cannot be deleted"):
        event.delete()


@pytest.mark.django_db
def test_audit_event_database_guard_blocks_queryset_update():
    event = record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN)
    with pytest.raises(DatabaseError):
        ControlPlaneAuditEvent.objects.filter(pk=event.pk).update(success=False)
    assert ControlPlaneAuditEvent.objects.get(pk=event.pk).success is True


@pytest.mark.django_db
def test_audit_event_database_guard_blocks_queryset_delete():
    event = record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN)
    with pytest.raises(DatabaseError):
        ControlPlaneAuditEvent.objects.filter(pk=event.pk).delete()
    assert ControlPlaneAuditEvent.objects.filter(pk=event.pk).exists()


@pytest.mark.django_db
def test_audit_event_creation_remains_supported():
    user = NexoraUser.objects.create(
        email="audit-actor@example.com",
        display_name="Audit Actor",
        status=NexoraUser.Status.ACTIVE,
    )
    event = record_control_plane_audit(
        event_type=ControlPlaneAuditEventType.LOGIN,
        actor=user,
        metadata={"source": "control-plane-test"},
    )
    assert event.actor_id == user.id
    assert event.metadata == {"source": "control-plane-test"}


@pytest.mark.django_db
def test_audit_metadata_rejects_sensitive_key_patterns():
    with pytest.raises(ValueError):
        record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, metadata={"access_token": "x"})
    with pytest.raises(ValueError):
        record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, metadata={"nested": [{"client-secret": "x"}]})


@pytest.mark.django_db
def test_audit_metadata_is_size_and_depth_bounded():
    with pytest.raises(ValueError, match="maximum size"):
        record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, metadata={"note": "x" * 9000})
    nested = value = {}
    for _ in range(10):
        value["next"] = {}
        value = value["next"]
    with pytest.raises(ValueError, match="nesting"):
        record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, metadata=nested)


def test_audit_correlation_id_is_normalized_and_bounded():
    event = record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, correlation_id="  req-123  ")
    assert event.correlation_id == "req-123"
    with pytest.raises(ValueError, match="too long"):
        record_control_plane_audit(event_type=ControlPlaneAuditEventType.LOGIN, correlation_id="x" * 129)


def test_audit_event_type_contract_is_explicit():
    assert ControlPlaneAuditEventType.TELEMETRY_CLEARED in ControlPlaneAuditEventType.values
