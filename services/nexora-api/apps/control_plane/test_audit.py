from django.test import SimpleTestCase

from .audit import (
    ControlPlaneAuditEventType,
    _validate_audit_metadata,
)


class ControlPlaneAuditBoundaryTests(SimpleTestCase):
    def test_declared_event_types_are_explicit(self):
        self.assertEqual(
            {
                "CONTROL_PLANE_LOGIN",
                "CONTROL_PLANE_LOGIN_FAILED",
                "PRINCIPAL_ROLE_CHANGED",
                "PRINCIPAL_ENABLED",
                "PRINCIPAL_DISABLED",
                "BOOTSTRAP_COMPLETED",
                "BOOTSTRAP_REJECTED",
            },
            set(ControlPlaneAuditEventType.values),
        )

    def test_safe_metadata_is_accepted(self):
        metadata = {"role_before": "auditor", "role_after": "owner", "nested": {"enabled": True}}
        self.assertEqual(_validate_audit_metadata(metadata), metadata)

    def test_credential_fields_are_rejected(self):
        for key in ("token", "id_token", "authorization", "password", "secret", "credential", "credentials"):
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    _validate_audit_metadata({key: "sensitive"})

    def test_nested_credential_fields_are_rejected(self):
        with self.assertRaises(ValueError):
            _validate_audit_metadata({"details": {"Authorization": "Bearer sensitive"}})

    def test_metadata_must_be_a_dictionary(self):
        with self.assertRaises(TypeError):
            _validate_audit_metadata(["not", "a", "dict"])
