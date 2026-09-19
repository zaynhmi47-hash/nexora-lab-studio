from datetime import date, datetime, time, timedelta

from django.utils import timezone

from apps.finance.models import FinanceTransaction


def _start_datetime(value: date) -> datetime:
    return timezone.make_aware(datetime.combine(value, time.min))


def _end_datetime(value: date) -> datetime:
    return timezone.make_aware(datetime.combine(value + timedelta(days=1), time.min))


def list_transactions(*, organization_id, direction=None, status=None, start_date=None, end_date=None):
    queryset = FinanceTransaction.objects.active().filter(organization_id=organization_id)
    if direction:
        queryset = queryset.filter(direction=direction)
    if status:
        queryset = queryset.filter(status=status)
    if start_date:
        queryset = queryset.filter(occurred_at__gte=_start_datetime(start_date))
    if end_date:
        queryset = queryset.filter(occurred_at__lt=_end_datetime(end_date))
    return queryset


def get_transaction_by_id(*, organization_id, transaction_id):
    return FinanceTransaction.objects.active().filter(
        organization_id=organization_id,
        id=transaction_id,
    ).first()
