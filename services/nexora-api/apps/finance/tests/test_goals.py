from datetime import date, datetime, timezone

from django.test import TestCase

from apps.finance.models import FinanceGoal, FinanceGoalContribution
from apps.finance.selectors.goal_selectors import get_finance_goal_summary, get_goal_progress
from apps.organizations.models import Organization


class FinanceGoalSelectorTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Goals Co", slug="goals-co")
        self.other = Organization.objects.create(name="Other Co", slug="other-co")

    def make_goal(self, **overrides):
        values = {
            "organization": self.organization,
            "name": "Emergency fund",
            "target_amount_minor": 1_000_000,
            "currency": "IDR",
            "start_date": date(2026, 9, 1),
            "target_date": date(2026, 9, 30),
        }
        values.update(overrides)
        return FinanceGoal.objects.create(**values)

    def make_contribution(self, goal, **overrides):
        values = {
            "organization": self.organization,
            "goal": goal,
            "amount_minor": 100_000,
            "currency": "IDR",
            "contributed_at": datetime(2026, 9, 15, 12, tzinfo=timezone.utc),
            "status": FinanceGoalContribution.Status.POSTED,
        }
        values.update(overrides)
        return FinanceGoalContribution.objects.create(**values)

    def test_progress_uses_posted_contributions_for_same_tenant_goal(self):
        goal = self.make_goal()
        self.make_contribution(goal, amount_minor=300_000)
        self.make_contribution(goal, amount_minor=200_000, status=FinanceGoalContribution.Status.VOID)
        self.make_contribution(goal, amount_minor=900_000, organization=self.other, goal=goal)

        result = get_goal_progress(goal=goal, today=date(2026, 9, 20))

        self.assertEqual(result["current_amount_minor"], 300_000)
        self.assertEqual(result["remaining_amount_minor"], 700_000)
        self.assertEqual(result["progress_percentage"], 30.0)
        self.assertEqual(result["contribution_count"], 1)

    def test_completed_caps_progress_and_remaining(self):
        goal = self.make_goal(target_amount_minor=500_000)
        self.make_contribution(goal, amount_minor=600_000)

        result = get_goal_progress(goal=goal, today=date(2026, 9, 20))

        self.assertEqual(result["current_amount_minor"], 600_000)
        self.assertEqual(result["remaining_amount_minor"], 0)
        self.assertEqual(result["progress_percentage"], 100.0)
        self.assertEqual(result["status"], "completed")

    def test_overdue_is_derived_when_target_is_past(self):
        goal = self.make_goal(target_date=date(2026, 9, 19))
        result = get_goal_progress(goal=goal, today=date(2026, 9, 20))
        self.assertEqual(result["status"], "overdue")
        self.assertEqual(result["days_remaining"], 0)

    def test_paused_and_archived_lifecycle_states_are_preserved(self):
        paused = self.make_goal(name="Paused", status=FinanceGoal.Status.PAUSED)
        archived = self.make_goal(name="Archived", status=FinanceGoal.Status.ARCHIVED)

        self.assertEqual(get_goal_progress(goal=paused, today=date(2026, 9, 20))["status"], "paused")
        self.assertEqual(get_goal_progress(goal=archived, today=date(2026, 9, 20))["status"], "archived")

    def test_summary_excludes_archived_totals(self):
        active = self.make_goal(target_amount_minor=1_000_000)
        archived = self.make_goal(name="Archived", target_amount_minor=2_000_000, status=FinanceGoal.Status.ARCHIVED)
        self.make_contribution(active, amount_minor=400_000)
        self.make_contribution(archived, amount_minor=500_000)

        result = get_finance_goal_summary(organization_id=self.organization.id, today=date(2026, 9, 20))

        self.assertEqual(result["goal_count"], 2)
        self.assertEqual(result["active_count"], 1)
        self.assertEqual(result["total_target_amount_minor"], 1_000_000)
        self.assertEqual(result["total_current_amount_minor"], 400_000)
