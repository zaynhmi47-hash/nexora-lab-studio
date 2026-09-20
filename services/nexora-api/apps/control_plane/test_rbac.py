from django.test import SimpleTestCase

from django.utils import timezone

from .models import ControlPlanePermission, ControlPlanePrincipal, ControlPlaneRole, ROLE_PERMISSIONS


class ControlPlaneRoleTests(SimpleTestCase):
    def test_owner_has_every_registered_permission(self):
        self.assertEqual(
            ROLE_PERMISSIONS[ControlPlaneRole.OWNER],
            frozenset(ControlPlanePermission.values),
        )

    def test_non_owner_roles_are_explicitly_scoped(self):
        for role in (
            ControlPlaneRole.PLATFORM_ADMIN,
            ControlPlaneRole.SECURITY_ADMIN,
            ControlPlaneRole.AUDITOR,
        ):
            self.assertIn(ControlPlanePermission.DASHBOARD_READ, ROLE_PERMISSIONS[role])
            self.assertNotIn(ControlPlanePermission.CONFIGURATION_MANAGE, ROLE_PERMISSIONS[role])

    def test_disabled_principal_has_no_permissions(self):
        principal = ControlPlanePrincipal(enabled=False, role=ControlPlaneRole.OWNER)
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))

    def test_deleted_principal_has_no_permissions(self):
        principal = ControlPlanePrincipal(
            enabled=True,
            role=ControlPlaneRole.OWNER,
            deleted_at=timezone.now(),
        )
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))

    def test_unknown_role_has_no_permissions(self):
        principal = ControlPlanePrincipal(enabled=True, role="unknown")
        self.assertFalse(principal.has_permission(ControlPlanePermission.DASHBOARD_READ))


class ControlPlaneAuthorizationBoundaryTests(SimpleTestCase):
    def test_every_declared_role_has_an_explicit_permission_set(self):
        self.assertEqual(set(ROLE_PERMISSIONS), set(ControlPlaneRole.values))

    def test_no_non_owner_role_can_manage_configuration(self):
        for role in ControlPlaneRole.values:
            if role != ControlPlaneRole.OWNER:
                self.assertFalse(
                    ControlPlanePermission.CONFIGURATION_MANAGE in ROLE_PERMISSIONS[role]
                )

    def test_security_admin_can_manage_security_but_not_operations(self):
        permissions = ROLE_PERMISSIONS[ControlPlaneRole.SECURITY_ADMIN]
        self.assertIn(ControlPlanePermission.SECURITY_MANAGE, permissions)
        self.assertNotIn(ControlPlanePermission.OPERATIONS_MANAGE, permissions)

    def test_platform_admin_can_manage_operations_but_not_security(self):
        permissions = ROLE_PERMISSIONS[ControlPlaneRole.PLATFORM_ADMIN]
        self.assertIn(ControlPlanePermission.OPERATIONS_MANAGE, permissions)
        self.assertNotIn(ControlPlanePermission.SECURITY_MANAGE, permissions)

    def test_auditor_is_read_only(self):
        permissions = ROLE_PERMISSIONS[ControlPlaneRole.AUDITOR]
        self.assertTrue(all(
            permission not in permissions
            for permission in (
                ControlPlanePermission.SECURITY_MANAGE,
                ControlPlanePermission.OPERATIONS_MANAGE,
                ControlPlanePermission.CONFIGURATION_MANAGE,
            )
        ))
