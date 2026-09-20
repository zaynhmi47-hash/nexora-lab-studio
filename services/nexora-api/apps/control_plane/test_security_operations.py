from django.test import SimpleTestCase

from .audit import ControlPlaneAuditEventType
from .models import ControlPlanePermission, ControlPlaneRole, ROLE_PERMISSIONS


class ControlPlaneSecurityOperationsBoundaryTests(SimpleTestCase):
    def test_security_read_is_available_to_security_auditor_and_owner(self):
        for role in (
            ControlPlaneRole.OWNER,
            ControlPlaneRole.SECURITY_ADMIN,
            ControlPlaneRole.AUDITOR,
        ):
            self.assertIn(ControlPlanePermission.SECURITY_READ, ROLE_PERMISSIONS[role])

    def test_security_manage_is_not_available_to_platform_admin_or_auditor(self):
        self.assertIn(ControlPlanePermission.SECURITY_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.SECURITY_ADMIN])
        self.assertNotIn(ControlPlanePermission.SECURITY_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.PLATFORM_ADMIN])
        self.assertNotIn(ControlPlanePermission.SECURITY_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.AUDITOR])

    def test_operations_manage_is_not_available_to_security_admin_or_auditor(self):
        self.assertIn(ControlPlanePermission.OPERATIONS_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.PLATFORM_ADMIN])
        self.assertNotIn(ControlPlanePermission.OPERATIONS_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.SECURITY_ADMIN])
        self.assertNotIn(ControlPlanePermission.OPERATIONS_MANAGE, ROLE_PERMISSIONS[ControlPlaneRole.AUDITOR])

    def test_telemetry_clear_is_an_explicit_audit_event(self):
        self.assertIn(ControlPlaneAuditEventType.TELEMETRY_CLEARED, ControlPlaneAuditEventType.values)

    def test_telemetry_clear_does_not_grant_configuration_access(self):
        for role in ControlPlaneRole.values:
            if role != ControlPlaneRole.OWNER:
                self.assertNotIn(
                    ControlPlanePermission.CONFIGURATION_MANAGE,
                    ROLE_PERMISSIONS[role],
                )


    def test_operations_overview_requires_services_read_boundary(self):
        for role in (
            ControlPlaneRole.OWNER,
            ControlPlaneRole.PLATFORM_ADMIN,
            ControlPlaneRole.AUDITOR,
        ):
            self.assertIn(ControlPlanePermission.SERVICES_READ, ROLE_PERMISSIONS[role])

    def test_security_admin_can_read_security_but_not_operations_management(self):
        self.assertIn(
            ControlPlanePermission.SECURITY_READ,
            ROLE_PERMISSIONS[ControlPlaneRole.SECURITY_ADMIN],
        )
        self.assertNotIn(
            ControlPlanePermission.OPERATIONS_MANAGE,
            ROLE_PERMISSIONS[ControlPlaneRole.SECURITY_ADMIN],
        )
