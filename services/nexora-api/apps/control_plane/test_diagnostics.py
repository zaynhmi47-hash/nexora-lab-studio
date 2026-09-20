from unittest.mock import patch

from django.test import SimpleTestCase

from .diagnostics import (
    DIAGNOSTIC_STATUSES,
    api_route_counts,
    api_route_diagnostic,
    database_diagnostic,
    diagnostic_status,
    firebase_configuration_diagnostic,
    overall_operations_status,
)


class ControlPlaneDiagnosticsContractTests(SimpleTestCase):
    def test_diagnostic_contract_has_stable_shape(self):
        result = diagnostic_status(
            status="healthy",
            checked_at="2026-09-20T00:00:00+00:00",
            latency_ms=1.5,
            details={"source": "test"},
        )
        self.assertEqual(set(result), {"status", "latency_ms", "checked_at", "details"})
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["latency_ms"], 1.5)
        self.assertEqual(result["details"]["source"], "test")

    def test_diagnostic_contract_rejects_unknown_status(self):
        with self.assertRaises(ValueError):
            diagnostic_status(status="broken", checked_at="2026-09-20T00:00:00+00:00", latency_ms=None)

    def test_diagnostic_statuses_are_explicit(self):
        self.assertEqual(DIAGNOSTIC_STATUSES, {"healthy", "degraded", "unavailable"})

    def test_api_route_counts_are_derived_without_network_calls(self):
        routes = [
            {"route": "/api/v1/users/"},
            {"route": "/api/v1/finance/transactions/"},
            {"route": "/api/v1/quran/"},
            {"route": "/ops/"},
        ]
        result = api_route_counts(routes)
        self.assertEqual(result["route_count"], 4)
        self.assertEqual(result["api_route_count"], 3)
        self.assertEqual(
            result["api_groups"],
            [
                {"name": "finance", "routes": 1},
                {"name": "quran", "routes": 1},
                {"name": "users", "routes": 1},
            ],
        )

    def test_api_diagnostic_uses_stable_contract(self):
        result = api_route_diagnostic([{"route": "/api/v1/users/"}], checked_at="2026-09-20T00:00:00+00:00")
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["latency_ms"], 0.0)
        self.assertEqual(result["details"]["api_route_count"], 1)

    @patch("apps.control_plane.diagnostics.connection")
    def test_database_diagnostic_returns_structured_success(self, connection_mock):
        result = database_diagnostic(checked_at="2026-09-20T00:00:00+00:00")
        self.assertEqual(result["status"], "healthy")
        self.assertIsInstance(result["latency_ms"], float)
        self.assertEqual(result["details"], {"check": "SELECT 1"})
        connection_mock.cursor.assert_called_once()

    @patch("apps.control_plane.diagnostics.connection")
    def test_database_diagnostic_does_not_leak_exception_message(self, connection_mock):
        connection_mock.cursor.side_effect = RuntimeError("SECRET database password")
        result = database_diagnostic(checked_at="2026-09-20T00:00:00+00:00")
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["details"], {"error_type": "RuntimeError"})
        self.assertNotIn("SECRET", str(result))

    @patch("apps.control_plane.diagnostics.check_firebase_configuration", return_value=True)
    def test_firebase_diagnostic_reports_configuration_only(self, check_mock):
        result = firebase_configuration_diagnostic(checked_at="2026-09-20T00:00:00+00:00")
        self.assertEqual(result["status"], "healthy")
        self.assertIsNone(result["latency_ms"])
        self.assertEqual(result["details"]["check"], "configuration-only")
        check_mock.assert_called_once()

    @patch("apps.control_plane.diagnostics.check_firebase_configuration", side_effect=RuntimeError("secret"))
    def test_firebase_diagnostic_sanitizes_errors(self, check_mock):
        result = firebase_configuration_diagnostic(checked_at="2026-09-20T00:00:00+00:00")
        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["details"]["error_type"], "RuntimeError")
        self.assertNotIn("secret", str(result))

    def test_overall_status_treats_database_as_critical(self):
        base = {
            "database": {"status": "healthy"},
            "firebase": {"status": "healthy"},
            "api": {"status": "healthy"},
        }
        self.assertEqual(overall_operations_status(base), "healthy")
        base["firebase"]["status"] = "unavailable"
        self.assertEqual(overall_operations_status(base), "degraded")
        base["database"]["status"] = "unavailable"
        self.assertEqual(overall_operations_status(base), "unavailable")
