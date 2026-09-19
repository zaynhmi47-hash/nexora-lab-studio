from datetime import date
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.finance.models import FinanceGoal, FinanceGoalContribution, FinanceTransaction
from apps.finance.selectors.planning_selectors import get_finance_planning_summary


@pytest.mark.django_db
def test_planning_summary_combines_actuals_budget_and_goal_pace(organization):
    FinanceTransaction.objects.create(
        organization=organization,
        direction=FinanceTransaction.Direction.INCOME,
        amount_minor=10_000_000,
        currency="IDR",
        category="sales",
        description="Revenue",
        occurred_at=timezone.make_aware(timezone.datetime(2026, 9, 10, 10, 0)),
        status=FinanceTransaction.Status.POSTED,
    )
    FinanceTransaction.objects.create(
        organization=organization,
        direction=FinanceTransaction.Direction.EXPENSE,
        amount_minor=2_000_000,
        currency="IDR",
        category="rent",
        description="Rent",
        occurred_at=timezone.make_aware(timezone.datetime(2026, 9, 12, 10, 0)),
        status=FinanceTransaction.Status.POSTED,
    )
    from apps.finance.models import FinanceBudget

    FinanceBudget.objects.create(
        organization=organization,
        name="Rent budget",
        category="rent",
        amount_minor=3_000_000,
        currency="IDR",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
    )
    goal = FinanceGoal.objects.create(
        organization=organization,
        name="Emergency fund",
        target_amount_minor=3_000_000,
        currency="IDR",
        start_date=date(2026, 9, 1),
        target_date=date(2026, 9, 30),
    )
    FinanceGoalContribution.objects.create(
        organization=organization,
        goal=goal,
        amount_minor=1_000_000,
        currency="IDR",
        contributed_at=timezone.make_aware(timezone.datetime(2026, 9, 5, 10, 0)),
        status=FinanceGoalContribution.Status.POSTED,
    )

    summary = get_finance_planning_summary(
        organization_id=organization.id,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
        today=date(2026, 9, 15),
    )

    assert summary["actual_income_minor"] == 10_000_000
    assert summary["actual_expense_minor"] == 2_000_000
    assert summary["planned_spending_minor"] == 3_000_000
    assert summary["actual_goal_contribution_minor"] == 1_000_000
    assert summary["planned_saving_minor"] == 1_000_000
    assert summary["saving_gap_minor"] == 0
    assert summary["projected_cash_after_plans_minor"] == 6_000_000


@pytest.mark.django_db
def test_planning_summary_does_not_treat_actual_balance_as_available_cash(organization):
    from apps.finance.models import FinanceBudget

    FinanceBudget.objects.create(
        organization=organization,
        name="Operations",
        category="operations",
        amount_minor=1_000_000,
        currency="IDR",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
    )
    summary = get_finance_planning_summary(
        organization_id=organization.id,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
        today=date(2026, 9, 15),
    )

    assert "available_cash_minor" not in summary
    assert summary["projected_cash_after_plans_minor"] == -1_000_000
