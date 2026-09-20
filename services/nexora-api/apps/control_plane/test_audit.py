from django.test import SimpleTestCase

from apps.core.middleware.context import RequestContext, get_request_context, set_request_context, reset_request_context

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


class ControlPlaneAuditCorrelationTests(SimpleTestCase):
    def test_audit_uses_request_context_when_correlation_id_is_omitted(self):
        token = set_request_context(RequestContext(correlation_id="req-123"))
        try:
            self.assertEqual(get_request_context().correlation_id, "req-123")
        finally:
            reset_request_context(token)

    def test_request_context_is_reset_after_test(self):
        self.assertIsNone(get_request_context().correlation_id)
