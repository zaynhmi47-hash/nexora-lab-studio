from django.test import SimpleTestCase

from .models import ControlPlanePermission, ControlPlanePrincipal, ControlPlaneRole, ROLE_PERMISSIONS


class ControlPlaneRoleTests(SimpleTestCase):
    def test_owner_has_every_registered_permission(self):
        self.assertEqual(ROLE_PERMISSIONS[ControlPlaneRole.OWNER], frozenset(ControlPlanePermission.values))

    def test_non_owner_roles_are_explicitly_scoped(self):
        for role in (ControlPlaneRole.PLATFORM_ADMIN, ControlPlaneRole.SECURITY_ADMIN, ControlPlaneRole.AUDITOR):
            self.assertIn(ControlPlanePermission.DASHBOARD_READ, ROLE_PERMISSIONS[role])
            self.assertNotIn(ControlPlanePermission.CONFIGURATION_MANAGE, ROLE_PERMISSIONS[role])

    def test_disabled_principal_has_no_permissions(self):
        principal = ControlPlanePrincipal(enabled=False, role=ControlPlaneRole.OWNER)
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))

    def test_deleted_principal_has_no_permissions(self):
        from django.utils import timezone
        principal = ControlPlanePrincipal(enabled=True, role=ControlPlaneRole.OWNER, deleted_at=timezone.now())
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))

    def test_unknown_role_has_no_permissions(self):
        principal = ControlPlanePrincipal(enabled=True, role="unknown")
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))
