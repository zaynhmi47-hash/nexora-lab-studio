from __future__ import annotations

from apps.finance.models import FinanceBudget


def list_budgets(*, organization_id, status=None, category=None, start_date=None, end_date=None):
    queryset = FinanceBudget.objects.active().filter(organization_id=organization_id)
    if status:
        queryset = queryset.filter(status=status)
    if category:
        queryset = queryset.filter(category=category)
    if start_date:
        queryset = queryset.filter(end_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(start_date__lte=end_date)
    return queryset


def get_budget_by_id(*, organization_id, budget_id):
    return FinanceBudget.objects.active().filter(
        organization_id=organization_id,
        id=budget_id,
    ).first()
