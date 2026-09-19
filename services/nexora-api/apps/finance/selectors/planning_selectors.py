from __future__ import annotations

from datetime import date

from django.db.models import BigIntegerField, Coalesce, Q, Sum, Value

from apps.finance.models import FinanceGoal, FinanceGoalContribution, FinanceTransaction
from apps.finance.selectors.budget_summary_selectors import get_finance_budget_summary


def _days_inclusive(start: date, end: date) -> int:
    return max((end - start).days + 1, 0)


def _planned_goal_saving(*, organization_id, start_date: date, end_date: date, today: date) -> tuple[int, int]:
    if end_date < today:
        return 0, 0

    zero = Value(0, output_field=BigIntegerField())
    goals = FinanceGoal.objects.active().filter(
        organization_id=organization_id,
        status=FinanceGoal.Status.ACTIVE,
        start_date__lte=end_date,
        target_date__gte=today,
    )

    planned = 0
    goal_count = 0
    for goal in goals:
        current = FinanceGoalContribution.objects.active().filter(
            organization_id=organization_id,
            goal_id=goal.id,
            status=FinanceGoalContribution.Status.POSTED,
        ).aggregate(current=Coalesce(Sum("amount_minor"), zero))["current"] or 0
        remaining = max(goal.target_amount_minor - int(current), 0)
        if remaining <= 0:
            continue

        pace_start = max(today, goal.start_date)
        pace_end = goal.target_date
        pace_days = _days_inclusive(pace_start, pace_end)
        allocation_start = max(start_date, pace_start)
        allocation_end = min(end_date, pace_end)
        allocation_days = _days_inclusive(allocation_start, allocation_end)
        if pace_days <= 0 or allocation_days <= 0:
            continue

        planned += (remaining * allocation_days) // pace_days
        goal_count += 1

    return planned, goal_count


def get_finance_planning_summary(*, organization_id, start_date: date, end_date: date, today=None) -> dict:
    today = today or date.today()
    zero = Value(0, output_field=BigIntegerField())

    actual = FinanceTransaction.objects.active().filter(
        organization_id=organization_id,
        status=FinanceTransaction.Status.POSTED,
        occurred_at__date__gte=start_date,
        occurred_at__date__lte=end_date,
    ).aggregate(
        income=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.INCOME)),
            zero,
        ),
        expense=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.EXPENSE)),
            zero,
        ),
    )
    actual_income = int(actual["income"] or 0)
    actual_expense = int(actual["expense"] or 0)
    actual_net = actual_income - actual_expense

    budget_summary = get_finance_budget_summary(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )
    planned_spending = int(budget_summary["total_budget_minor"])
    planned_spending_gap = planned_spending - actual_expense

    planned_saving, planned_goal_count = _planned_goal_saving(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
        today=today,
    )
    actual_saving = int(
        FinanceGoalContribution.objects.active().filter(
            organization_id=organization_id,
            status=FinanceGoalContribution.Status.POSTED,
            contributed_at__date__gte=start_date,
            contributed_at__date__lte=end_date,
        ).aggregate(amount=Coalesce(Sum("amount_minor"), zero))["amount"] or 0
    )
    saving_gap = planned_saving - actual_saving
    projected_after_plans = actual_income - planned_spending - planned_saving

    if projected_after_plans < 0:
        planning_status = "over_planned"
    elif planned_spending and budget_summary["over_budget_count"] > 0:
        planning_status = "budget_overage"
    elif saving_gap > 0:
        planning_status = "saving_gap"
    else:
        planning_status = "on_track"

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": "IDR",
        "actual_income_minor": actual_income,
        "actual_expense_minor": actual_expense,
        "actual_net_cash_flow_minor": actual_net,
        "planned_spending_minor": planned_spending,
        "planned_saving_minor": planned_saving,
        "actual_goal_contribution_minor": actual_saving,
        "planned_spending_gap_minor": planned_spending_gap,
        "saving_gap_minor": saving_gap,
        "projected_cash_after_plans_minor": projected_after_plans,
        "active_goal_count": planned_goal_count,
        "over_budget_count": budget_summary["over_budget_count"],
        "planning_status": planning_status,
    }
