from __future__ import annotations

from datetime import date, timedelta

from apps.finance.selectors.summary_selectors import get_finance_summary


def _metric(current: int, previous: int) -> dict:
    delta = current - previous
    percentage_change = None if previous == 0 else (delta / previous) * 100
    return {
        "current": current,
        "previous": previous,
        "delta": delta,
        "percentage_change": percentage_change,
    }


def get_finance_period_comparison(
    *,
    organization_id,
    start_date: date,
    end_date: date,
) -> dict:
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")

    period_days = (end_date - start_date).days + 1
    previous_end_date = start_date - timedelta(days=1)
    previous_start_date = previous_end_date - timedelta(days=period_days - 1)

    current = get_finance_summary(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )
    previous = get_finance_summary(
        organization_id=organization_id,
        start_date=previous_start_date,
        end_date=previous_end_date,
    )

    return {
        "current_start_date": start_date,
        "current_end_date": end_date,
        "previous_start_date": previous_start_date,
        "previous_end_date": previous_end_date,
        "currency": "IDR",
        "income": _metric(current["total_income_minor"], previous["total_income_minor"]),
        "expense": _metric(current["total_expense_minor"], previous["total_expense_minor"]),
        "net_cash_flow": _metric(current["net_cash_flow_minor"], previous["net_cash_flow_minor"]),
        "transaction_count": _metric(current["transaction_count"], previous["transaction_count"]),
    }
