from __future__ import annotations

from datetime import date

from django.db.models import Count, Sum

from apps.finance.models import FinanceTransaction
from apps.finance.selectors.summary_selectors import _posted_period_queryset


def get_finance_cash_flow(*, organization_id, start_date: date, end_date: date) -> dict:
    queryset = _posted_period_queryset(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )

    rows = list(
        queryset.values("category", "direction")
        .annotate(
            amount_minor=Sum("amount_minor"),
            transaction_count=Count("id"),
        )
        .order_by("direction", "-amount_minor", "category")
    )

    inflow_lines = [
        {
            "category": row["category"],
            "amount_minor": row["amount_minor"],
            "transaction_count": row["transaction_count"],
        }
        for row in rows
        if row["direction"] == FinanceTransaction.Direction.INCOME
    ]
    outflow_lines = [
        {
            "category": row["category"],
            "amount_minor": row["amount_minor"],
            "transaction_count": row["transaction_count"],
        }
        for row in rows
        if row["direction"] == FinanceTransaction.Direction.EXPENSE
    ]

    cash_inflow = sum(item["amount_minor"] for item in inflow_lines)
    cash_outflow = sum(item["amount_minor"] for item in outflow_lines)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": "IDR",
        "cash_inflow_minor": cash_inflow,
        "cash_outflow_minor": cash_outflow,
        "net_cash_flow_minor": cash_inflow - cash_outflow,
        "transaction_count": sum(item["transaction_count"] for item in inflow_lines + outflow_lines),
        "inflow_lines": inflow_lines,
        "outflow_lines": outflow_lines,
    }
