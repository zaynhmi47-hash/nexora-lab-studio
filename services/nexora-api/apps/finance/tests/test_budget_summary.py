from datetime import date, datetime, timezone

from django.test import TestCase

from apps.finance.models import FinanceBudget, FinanceTransaction
from apps.finance.selectors.budget_summary_selectors import get_finance_budget_summary
from apps.organizations.models import Organization


class FinanceBudgetSummarySelectorTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Acme Finance", slug="acme-finance")
        self.other_organization = Organization.objects.create(name="Other Finance", slug="other-finance")

    def make_budget(self, **overrides):
        values = {
            "organization": self.organization,
            "name": "Marketing",
            "category": "marketing",
            "amount_minor": 1_000_000,
            "currency": "IDR",
            "start_date": date(2026, 9, 1),
            "end_date": date(2026, 9, 30),
        }
        values.update(overrides)
        return FinanceBudget.objects.create(**values)

    def make_transaction(self, **overrides):
        values = {
            "organization": self.organization,
            "direction": FinanceTransaction.Direction.EXPENSE,
            "amount_minor": 100_000,
            "currency": "IDR",
            "category": "marketing",
            "description": "Ad spend",
            "occurred_at": datetime(2026, 9, 15, 12, tzinfo=timezone.utc),
            "status": FinanceTransaction.Status.POSTED,
        }
        values.update(overrides)
        return FinanceTransaction.objects.create(**values)

    def test_matches_posted_expense_by_exact_category_and_tenant(self):
        self.make_budget()
        self.make_transaction(amount_minor=300_000)
        self.make_transaction(amount_minor=900_000, category="office")
        self.make_transaction(
            amount_minor=700_000,
            organization=self.other_organization,
        )
        self.make_transaction(
            amount_minor=500_000,
            status=FinanceTransaction.Status.VOID,
        )

        result = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )

        item = result["budgets"][0]
        self.assertEqual(item["actual_minor"], 300_000)
        self.assertEqual(item["transaction_count"], 1)
        self.assertEqual(result["total_actual_minor"], 300_000)

    def test_period_boundaries_are_inclusive(self):
        self.make_budget()
        self.make_transaction(amount_minor=100_000, occurred_at=datetime(2026, 9, 1, 0, tzinfo=timezone.utc))
        self.make_transaction(amount_minor=200_000, occurred_at=datetime(2026, 9, 30, 23, 59, tzinfo=timezone.utc))
        self.make_transaction(amount_minor=900_000, occurred_at=datetime(2026, 10, 1, 0, tzinfo=timezone.utc))

        result = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )

        self.assertEqual(result["budgets"][0]["actual_minor"], 300_000)

    def test_budget_is_prorated_for_partial_overlap(self):
        self.make_budget(
            amount_minor=3_000_000,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )
        result = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 11),
            end_date=date(2026, 9, 20),
        )

        self.assertEqual(result["budgets"][0]["budget_minor"], 1_000_000)

    def test_status_thresholds(self):
        self.make_budget(amount_minor=1_000_000)
        self.make_transaction(amount_minor=799_999)
        first = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )
        self.assertEqual(first["budgets"][0]["status"], "on_track")

        FinanceTransaction.objects.all().delete()
        self.make_transaction(amount_minor=800_000)
        second = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )
        self.assertEqual(second["budgets"][0]["status"], "near_limit")

        FinanceTransaction.objects.all().delete()
        self.make_transaction(amount_minor=1_000_001)
        third = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )
        self.assertEqual(third["budgets"][0]["status"], "over_budget")
        self.assertEqual(third["budgets"][0]["remaining_minor"], -1)

    def test_archived_budget_is_excluded(self):
        self.make_budget(status=FinanceBudget.Status.ARCHIVED)
        result = get_finance_budget_summary(
            organization_id=self.organization.id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 30),
        )
        self.assertEqual(result["budgets"], [])
        self.assertEqual(result["total_budget_minor"], 0)
