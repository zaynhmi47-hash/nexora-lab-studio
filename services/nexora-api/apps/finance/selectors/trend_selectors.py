from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.db.models import BigIntegerField, Count, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDate, TruncMonth, TruncWeek

from apps.finance.models import FinanceTransaction
from apps.finance.selectors.summary_selectors import _posted_period_queryset


def get_finance_trend(
    *,
    organization_id,
    start_date: date,
    end_date: date,
    granularity: str,
) -> list[dict]:
    queryset = _posted_period_queryset(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )

    if granularity == "day":
        truncated = TruncDate("occurred_at")
    elif granularity == "week":
        truncated = TruncWeek("occurred_at")
    else:
        truncated = TruncMonth("occurred_at")

    zero = Value(0, output_field=BigIntegerField())
    rows = queryset.annotate(period_start=truncated).values("period_start").annotate(
        income_minor=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.INCOME)),
            zero,
        ),
        expense_minor=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.EXPENSE)),
            zero,
        ),
        transaction_count=Count("id"),
    ).order_by("period_start")

    result = []
    for row in rows:
        period_start = row["period_start"]
        if granularity == "day":
            period_end = period_start
        elif granularity == "week":
            period_end = period_start + timedelta(days=6)
        else:
            next_month = (
                period_start.replace(day=28) + timedelta(days=4)
            ).replace(day=1)
            period_end = next_month - timedelta(days=1)

        bounded_start = max(period_start, start_date)
        bounded_end = min(period_end, end_date)
        result.append({
            "period_start": bounded_start,
            "period_end": bounded_end,
            "income_minor": row["income_minor"],
            "expense_minor": row["expense_minor"],
            "net_cash_flow_minor": row["income_minor"] - row["expense_minor"],
            "transaction_count": row["transaction_count"],
        })

    return result
