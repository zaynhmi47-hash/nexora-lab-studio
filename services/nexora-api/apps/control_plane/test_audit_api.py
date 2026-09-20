from django.test import SimpleTestCase

from .audit import ControlPlaneAuditEventType


class ControlPlaneAuditApiBoundaryTests(SimpleTestCase):
    def test_audit_permission_is_declared(self):
        from .models import ControlPlanePermission
        self.assertEqual(ControlPlanePermission.AUDIT_READ, "audit.read")

    def test_event_type_filter_uses_declared_values(self):
        self.assertIn(ControlPlaneAuditEventType.LOGIN, ControlPlaneAuditEventType.values)
        self.assertIn(ControlPlaneAuditEventType.PRINCIPAL_ROLE_CHANGED, ControlPlaneAuditEventType.values)

    def test_sensitive_event_types_are_not_missing(self):
        required = {
            ControlPlaneAuditEventType.LOGIN,
            ControlPlaneAuditEventType.LOGIN_FAILED,
            ControlPlaneAuditEventType.BOOTSTRAP_COMPLETED,
            ControlPlaneAuditEventType.BOOTSTRAP_REJECTED,
            ControlPlaneAuditEventType.PRINCIPAL_ROLE_CHANGED,
            ControlPlaneAuditEventType.PRINCIPAL_ENABLED,
            ControlPlaneAuditEventType.PRINCIPAL_DISABLED,
        }
        self.assertTrue(required.issubset(set(ControlPlaneAuditEventType.values)))
