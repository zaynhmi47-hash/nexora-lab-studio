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


def get_finance_summary(*, organization_id, start_date: date, end_date: date) -> dict:
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")

    queryset = FinanceTransaction.objects.active().filter(
        organization_id=organization_id,
        status=FinanceTransaction.Status.POSTED,
        occurred_at__gte=_start_datetime(start_date),
        occurred_at__lt=_end_datetime(end_date),
    )

    zero = Value(0, output_field=BigIntegerField())
    summary = queryset.aggregate(
        total_income_minor=Coalesce(
            Sum(
                "amount_minor",
                filter=Q(direction=FinanceTransaction.Direction.INCOME),
            ),
            zero,
        ),
        total_expense_minor=Coalesce(
            Sum(
                "amount_minor",
                filter=Q(direction=FinanceTransaction.Direction.EXPENSE),
            ),
            zero,
        ),
        transaction_count=Count("id"),
    )

    summary["net_cash_flow_minor"] = (
        summary["total_income_minor"] - summary["total_expense_minor"]
    )
    summary["currency"] = "IDR"
    summary["start_date"] = start_date
    summary["end_date"] = end_date
    return summary
