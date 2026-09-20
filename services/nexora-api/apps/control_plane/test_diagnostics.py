from django.test import SimpleTestCase

from .diagnostics import DIAGNOSTIC_STATUSES, api_route_counts, diagnostic_status


class ControlPlaneDiagnosticsContractTests(SimpleTestCase):
    def test_diagnostic_contract_has_stable_shape(self):
        result = diagnostic_status(
            status="healthy",
            checked_at="2026-09-20T00:00:00+00:00",
            latency_ms=1.5,
            details={"source": "test"},
        )
        self.assertEqual(
            set(result),
            {"status", "latency_ms", "checked_at", "details"},
        )
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["latency_ms"], 1.5)
        self.assertEqual(result["details"]["source"], "test")

    def test_diagnostic_contract_rejects_unknown_status(self):
        with self.assertRaises(ValueError):
            diagnostic_status(
                status="broken",
                checked_at="2026-09-20T00:00:00+00:00",
                latency_ms=None,
            )

    def test_diagnostic_statuses_are_explicit(self):
        self.assertEqual(
            DIAGNOSTIC_STATUSES,
            {"healthy", "degraded", "unavailable"},
        )

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
            [{"name": "v1", "routes": 3}],
        )
