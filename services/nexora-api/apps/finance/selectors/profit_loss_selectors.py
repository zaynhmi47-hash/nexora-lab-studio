from __future__ import annotations

from datetime import date

from django.db.models import Count, Sum

from apps.finance.models import FinanceTransaction
from apps.finance.selectors.summary_selectors import _posted_period_queryset


def get_finance_profit_loss(*, organization_id, start_date: date, end_date: date) -> dict:
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

    income_lines = [
        {
            "category": row["category"],
            "amount_minor": row["amount_minor"],
            "transaction_count": row["transaction_count"],
        }
        for row in rows
        if row["direction"] == FinanceTransaction.Direction.INCOME
    ]
    expense_lines = [
        {
            "category": row["category"],
            "amount_minor": row["amount_minor"],
            "transaction_count": row["transaction_count"],
        }
        for row in rows
        if row["direction"] == FinanceTransaction.Direction.EXPENSE
    ]

    total_income = sum(item["amount_minor"] for item in income_lines)
    total_expense = sum(item["amount_minor"] for item in expense_lines)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": "IDR",
        "total_income_minor": total_income,
        "total_expense_minor": total_expense,
        "net_profit_minor": total_income - total_expense,
        "income_lines": income_lines,
        "expense_lines": expense_lines,
    }
