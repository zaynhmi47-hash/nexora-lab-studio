from apps.finance.models import FinanceTransaction


def list_transactions(*, organization_id, direction=None, status=None):
    queryset = FinanceTransaction.objects.active().filter(organization_id=organization_id)
    if direction:
        queryset = queryset.filter(direction=direction)
    if status:
        queryset = queryset.filter(status=status)
    return queryset


def get_transaction_by_id(*, organization_id, transaction_id):
    return FinanceTransaction.objects.active().filter(
        organization_id=organization_id,
        id=transaction_id,
    ).first()
