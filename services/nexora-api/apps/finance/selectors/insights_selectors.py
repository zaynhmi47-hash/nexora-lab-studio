from __future__ import annotations

from datetime import date, timedelta

from django.db.models import Count, Sum

from apps.finance.models import FinanceTransaction
from apps.finance.selectors.summary_selectors import _posted_period_queryset


def _percentage_change(current: int, previous: int) -> float | None:
    if previous == 0:
        return None
    return ((current - previous) / previous) * 100


def _insight(
    *,
    code: str,
    severity: str,
    title: str,
    message: str,
    metric: str,
    value_minor: int | None = None,
    delta_minor: int | None = None,
    percentage_change: float | None = None,
    category: str | None = None,
) -> dict:
    return {
        "code": code,
        "severity": severity,
        "title": title,
        "message": message,
        "metric": metric,
        "value_minor": value_minor,
        "delta_minor": delta_minor,
        "percentage_change": percentage_change,
        "category": category,
    }


def get_finance_insights(*, organization_id, start_date: date, end_date: date) -> dict:
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")

    period_days = (end_date - start_date).days + 1
    previous_end_date = start_date - timedelta(days=1)
    previous_start_date = previous_end_date - timedelta(days=period_days - 1)

    current_qs = _posted_period_queryset(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )
    previous_qs = _posted_period_queryset(
        organization_id=organization_id,
        start_date=previous_start_date,
        end_date=previous_end_date,
    )

    current_rows = list(
        current_qs.values("category", "direction")
        .annotate(amount_minor=Sum("amount_minor"), transaction_count=Count("id"))
        .order_by("-amount_minor", "category")
    )
    previous_rows = list(
        previous_qs.values("category", "direction")
        .annotate(amount_minor=Sum("amount_minor"), transaction_count=Count("id"))
    )

    current_income = sum(
        row["amount_minor"] for row in current_rows
        if row["direction"] == FinanceTransaction.Direction.INCOME
    )
    current_expense = sum(
        row["amount_minor"] for row in current_rows
        if row["direction"] == FinanceTransaction.Direction.EXPENSE
    )
    previous_income = sum(
        row["amount_minor"] for row in previous_rows
        if row["direction"] == FinanceTransaction.Direction.INCOME
    )
    previous_expense = sum(
        row["amount_minor"] for row in previous_rows
        if row["direction"] == FinanceTransaction.Direction.EXPENSE
    )

    current_count = sum(row["transaction_count"] for row in current_rows)
    net_cash_flow = current_income - current_expense
    income_change = current_income - previous_income
    expense_change = current_expense - previous_expense
    income_percentage = _percentage_change(current_income, previous_income)
    expense_percentage = _percentage_change(current_expense, previous_expense)

    insights: list[dict] = []

    if current_count == 0:
        insights.append(
            _insight(
                code="no_transactions",
                severity="info",
                title="No posted transactions",
                message="There are no posted transactions in the selected period.",
                metric="transaction_count",
                value_minor=None,
                delta_minor=-sum(row["transaction_count"] for row in previous_rows),
                percentage_change=None,
            )
        )
    else:
        if net_cash_flow < 0:
            insights.append(
                _insight(
                    code="negative_cash_flow",
                    severity="warning",
                    title="Negative net cash flow",
                    message="Posted expenses are higher than posted income in the selected period.",
                    metric="net_cash_flow",
                    value_minor=net_cash_flow,
                    delta_minor=None,
                    percentage_change=None,
                )
            )

        if previous_expense > 0 and current_expense > previous_expense * 1.2:
            insights.append(
                _insight(
                    code="expense_spike",
                    severity="warning",
                    title="Expenses increased",
                    message=f"Posted expenses increased by {expense_percentage:.1f}% compared with the preceding period.",
                    metric="expense",
                    value_minor=current_expense,
                    delta_minor=expense_change,
                    percentage_change=expense_percentage,
                )
            )

        if previous_income > 0 and current_income < previous_income * 0.8:
            insights.append(
                _insight(
                    code="income_drop",
                    severity="warning",
                    title="Income decreased",
                    message=f"Posted income decreased by {abs(income_percentage):.1f}% compared with the preceding period.",
                    metric="income",
                    value_minor=current_income,
                    delta_minor=income_change,
                    percentage_change=income_percentage,
                )
            )

        expense_rows = [
            row for row in current_rows
            if row["direction"] == FinanceTransaction.Direction.EXPENSE
        ]
        if expense_rows and current_expense > 0:
            top_expense = expense_rows[0]
            concentration = (top_expense["amount_minor"] / current_expense) * 100
            if concentration >= 50:
                insights.append(
                    _insight(
                        code="expense_concentration",
                        severity="info",
                        title="Expense concentration",
                        message=f"{top_expense['category']} represents {concentration:.1f}% of posted expenses in the selected period.",
                        metric="expense",
                        value_minor=top_expense["amount_minor"],
                        delta_minor=None,
                        percentage_change=concentration,
                        category=top_expense["category"],
                    )
                )

        if current_income > 0 and previous_income == 0:
            insights.append(
                _insight(
                    code="new_income_activity",
                    severity="info",
                    title="Income activity detected",
                    message="Posted income exists in the selected period while the preceding period had no posted income.",
                    metric="income",
                    value_minor=current_income,
                    delta_minor=current_income,
                    percentage_change=None,
                )
            )

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": "IDR",
        "insights": insights,
    }
