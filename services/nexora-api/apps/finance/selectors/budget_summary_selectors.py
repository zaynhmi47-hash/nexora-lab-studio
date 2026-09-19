from __future__ import annotations

from datetime import date

from django.db.models import BigIntegerField, Count, Sum, Value
from django.db.models.functions import Coalesce

from apps.finance.models import FinanceBudget, FinanceTransaction


def _overlap_days(start_a: date, end_a: date, start_b: date, end_b: date) -> int:
    start = max(start_a, start_b)
    end = min(end_a, end_b)
    return max(0, (end - start).days + 1)


def get_finance_budget_summary(*, organization_id, start_date: date, end_date: date) -> dict:
    budgets = list(
        FinanceBudget.objects.active().filter(
            organization_id=organization_id,
            status=FinanceBudget.Status.ACTIVE,
            end_date__gte=start_date,
            start_date__lte=end_date,
        ).order_by("start_date", "category", "name")
    )

    items = []
    total_budget = 0
    total_actual = 0
    over_budget_count = 0
    zero = Value(0, output_field=BigIntegerField())
    for budget in budgets:
        overlap_days = _overlap_days(budget.start_date, budget.end_date, start_date, end_date)
        budget_days = (budget.end_date - budget.start_date).days + 1
        allocated_budget = (budget.amount_minor * overlap_days) // budget_days

        actual_start = max(budget.start_date, start_date)
        actual_end = min(budget.end_date, end_date)
        actual = FinanceTransaction.objects.active().filter(
            organization_id=organization_id,
            status=FinanceTransaction.Status.POSTED,
            direction=FinanceTransaction.Direction.EXPENSE,
            category=budget.category,
            occurred_at__date__gte=actual_start,
            occurred_at__date__lte=actual_end,
        ).aggregate(
            amount_minor=Coalesce(Sum("amount_minor"), zero),
            transaction_count=Count("id"),
        )
        actual_minor = actual["amount_minor"]
        remaining_minor = allocated_budget - actual_minor
        utilization = (actual_minor / allocated_budget * 100) if allocated_budget else None
        if actual_minor > allocated_budget:
            status = "over_budget"
            over_budget_count += 1
        elif allocated_budget and actual_minor >= allocated_budget * 0.8:
            status = "near_limit"
        else:
            status = "on_track"

        items.append({
            "budget_id": budget.id,
            "name": budget.name,
            "category": budget.category,
            "start_date": budget.start_date,
            "end_date": budget.end_date,
            "budget_minor": allocated_budget,
            "actual_minor": actual_minor,
            "remaining_minor": remaining_minor,
            "utilization_percentage": utilization,
            "status": status,
            "transaction_count": actual["transaction_count"],
        })
        total_budget += allocated_budget
        total_actual += actual_minor

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": "IDR",
        "total_budget_minor": total_budget,
        "total_actual_minor": total_actual,
        "total_remaining_minor": total_budget - total_actual,
        "overall_utilization_percentage": (total_actual / total_budget * 100) if total_budget else None,
        "over_budget_count": over_budget_count,
        "budgets": items,
    }
