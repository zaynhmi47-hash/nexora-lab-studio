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
        transaction_record = FinanceTransaction(
            organization=organization,
            direction=direction,
            amount_minor=amount_minor,
            currency=currency,
            category=category,
            description=description,
            occurred_at=occurred_at,
            reference=reference,
            idempotency_key=idempotency_key,
            metadata={} if metadata is None else metadata,
        )
        try:
            transaction_record.save()
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
        return transaction_record
