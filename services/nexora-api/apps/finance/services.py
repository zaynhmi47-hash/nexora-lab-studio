from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce

from apps.core.exceptions import NotFoundException, ValidationException
from apps.identity.models import NexoraUser
from apps.organizations.models import Organization

from .models import Transaction


class FinanceService:
    @staticmethod
    def _base_queryset(*, user: NexoraUser, organization_id):
        return Transaction.objects.filter(
            organization_id=organization_id,
            organization__memberships__user=user,
            organization__memberships__status="active",
            organization__status=Organization.Status.ACTIVE,
        ).distinct()

    @staticmethod
    def list_transactions(
        *,
        user: NexoraUser,
        organization_id,
        transaction_type: str | None = None,
        category: str | None = None,
        occurred_from: datetime | None = None,
        occurred_to: datetime | None = None,
    ):
        queryset = FinanceService._base_queryset(user=user, organization_id=organization_id)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if category:
            queryset = queryset.filter(category__iexact=category.strip())
        if occurred_from:
            queryset = queryset.filter(occurred_at__gte=occurred_from)
        if occurred_to:
            queryset = queryset.filter(occurred_at__lt=occurred_to)
        return queryset

    @staticmethod
    def summarize_transactions(*, user: NexoraUser, organization_id, occurred_from=None, occurred_to=None):
        queryset = FinanceService._base_queryset(user=user, organization_id=organization_id)
        if occurred_from:
            queryset = queryset.filter(occurred_at__gte=occurred_from)
        if occurred_to:
            queryset = queryset.filter(occurred_at__lt=occurred_to)

        zero = Value(Decimal("0.00"), output_field=DecimalField(max_digits=18, decimal_places=2))
        totals = queryset.aggregate(
            income=Coalesce(Sum("amount", filter=Q(transaction_type=Transaction.TransactionType.INCOME)), zero),
            expense=Coalesce(Sum("amount", filter=Q(transaction_type=Transaction.TransactionType.EXPENSE)), zero),
        )
        income = totals["income"]
        expense = totals["expense"]
        return {
            "income": income,
            "expense": expense,
            "net": income - expense,
            "currency": "IDR",
        }

    @staticmethod
    @transaction.atomic
    def create_transaction(
        *,
        user: NexoraUser,
        organization_id,
        transaction_type: str,
        amount: Decimal,
        currency: str,
        category: str,
        description: str,
        occurred_at: datetime,
    ) -> Transaction:
        organization = Organization.objects.active().filter(
            id=organization_id,
            memberships__user=user,
            memberships__status="active",
        ).distinct().first()
        if organization is None or organization.status != Organization.Status.ACTIVE:
            raise NotFoundException("Active organization membership is required.")

        if transaction_type not in Transaction.TransactionType.values:
            raise ValidationException("transaction_type must be income or expense.")
        if amount <= 0:
            raise ValidationException("amount must be greater than zero.")
        normalized_currency = currency.strip().upper()
        if len(normalized_currency) != 3 or not normalized_currency.isalpha():
            raise ValidationException("currency must be a 3-letter ISO currency code.")
        normalized_category = category.strip()
        if not normalized_category:
            raise ValidationException("category is required.")

        return Transaction.objects.create(
            organization=organization,
            transaction_type=transaction_type,
            amount=amount,
            currency=normalized_currency,
            category=normalized_category,
            description=description.strip(),
            occurred_at=occurred_at,
        )
