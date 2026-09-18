from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.exceptions import ConflictException, ValidationException
from apps.finance.models import FinanceTransaction


class FinanceTransactionService:
    @staticmethod
    @transaction.atomic
    def create_transaction(*, organization, direction: str, amount_minor: int, category: str,
                           occurred_at, currency: str = "IDR", description: str = "",
                           reference: str = "", idempotency_key: str = "", metadata: dict | None = None) -> FinanceTransaction:
        if idempotency_key:
            existing = FinanceTransaction.objects.active().filter(
                organization=organization, idempotency_key=idempotency_key
            ).first()
            if existing is not None:
                return existing
        record = FinanceTransaction(
            organization=organization, direction=direction, amount_minor=amount_minor,
            currency=currency, category=category, description=description,
            occurred_at=occurred_at, reference=reference, idempotency_key=idempotency_key,
            metadata={} if metadata is None else metadata,
        )
        try:
            record.save()
        except IntegrityError as exc:
            if idempotency_key:
                existing = FinanceTransaction.objects.active().filter(
                    organization=organization, idempotency_key=idempotency_key
                ).first()
                if existing is not None:
                    return existing
            raise ConflictException("A transaction with this idempotency key already exists.") from exc
        except ValidationError as exc:
            raise ValidationException("Transaction data is invalid.", details=exc.message_dict) from exc
        return record

    @staticmethod
    @transaction.atomic
    def update_transaction(*, transaction_record: FinanceTransaction, **changes) -> FinanceTransaction:
        if transaction_record.status == FinanceTransaction.Status.VOID:
            raise ValidationException("Void transactions cannot be edited.")
        allowed = {"direction", "amount_minor", "currency", "category", "description", "occurred_at", "reference", "metadata"}
        for field, value in changes.items():
            if field in allowed:
                setattr(transaction_record, field, value)
        try:
            transaction_record.save()
        except ValidationError as exc:
            raise ValidationException("Transaction data is invalid.", details=exc.message_dict) from exc
        return transaction_record

    @staticmethod
    @transaction.atomic
    def void_transaction(*, transaction_record: FinanceTransaction) -> FinanceTransaction:
        if transaction_record.status == FinanceTransaction.Status.VOID:
            return transaction_record
        transaction_record.status = FinanceTransaction.Status.VOID
        try:
            transaction_record.save()
        except ValidationError as exc:
            raise ValidationException("Transaction data is invalid.", details=exc.message_dict) from exc
        return transaction_record
