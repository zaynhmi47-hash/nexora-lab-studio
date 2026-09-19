from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.db.models import BigIntegerField, Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.finance.models import FinanceTransaction


def _start_datetime(value: date) -> datetime:
    return timezone.make_aware(datetime.combine(value, time.min))


def _end_datetime(value: date) -> datetime:
    return timezone.make_aware(datetime.combine(value + timedelta(days=1), time.min))


def get_current_month_period(*, today: date | None = None) -> tuple[date, date]:
    current = today or timezone.localdate()
    return current.replace(day=1), current


def _posted_period_queryset(*, organization_id, start_date: date, end_date: date):
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")
    return FinanceTransaction.objects.active().filter(
        organization_id=organization_id,
        status=FinanceTransaction.Status.POSTED,
        occurred_at__gte=_start_datetime(start_date),
        occurred_at__lt=_end_datetime(end_date),
    )


def get_finance_summary(*, organization_id, start_date: date, end_date: date) -> dict:
    queryset = _posted_period_queryset(
        organization_id=organization_id, start_date=start_date, end_date=end_date,
    )
    zero = Value(0, output_field=BigIntegerField())
    summary = queryset.aggregate(
        total_income_minor=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.INCOME)),
            zero,
        ),
        total_expense_minor=Coalesce(
            Sum("amount_minor", filter=Q(direction=FinanceTransaction.Direction.EXPENSE)),
            zero,
        ),
        transaction_count=Count("id"),
    )
    summary["net_cash_flow_minor"] = summary["total_income_minor"] - summary["total_expense_minor"]
    summary["currency"] = "IDR"
    summary["start_date"] = start_date
    summary["end_date"] = end_date
    return summary


def get_finance_category_breakdown(*, organization_id, start_date: date, end_date: date) -> list[dict]:
    queryset = _posted_period_queryset(
        organization_id=organization_id, start_date=start_date, end_date=end_date,
    )
    rows = queryset.values("category", "direction").annotate(
        amount_minor=Sum("amount_minor"),
        transaction_count=Count("id"),
    ).order_by("direction", "-amount_minor", "category")
    return list(rows)
