from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.core.exceptions import ValidationException
from apps.finance.models import FinanceBudget


class FinanceBudgetService:
    @staticmethod
    @transaction.atomic
    def create_budget(*, organization, **data) -> FinanceBudget:
        record = FinanceBudget(organization=organization, **data)
        try:
            record.save()
        except ValidationError as exc:
            raise ValidationException("Budget data is invalid.", details=exc.message_dict) from exc
        return record

    @staticmethod
    @transaction.atomic
    def update_budget(*, budget_record: FinanceBudget, **changes) -> FinanceBudget:
        if budget_record.status == FinanceBudget.Status.ARCHIVED:
            raise ValidationException("Archived budgets cannot be edited.")
        for field, value in changes.items():
            setattr(budget_record, field, value)
        try:
            budget_record.save()
        except ValidationError as exc:
            raise ValidationException("Budget data is invalid.", details=exc.message_dict) from exc
        return budget_record

    @staticmethod
    @transaction.atomic
    def archive_budget(*, budget_record: FinanceBudget) -> FinanceBudget:
        if budget_record.status == FinanceBudget.Status.ARCHIVED:
            return budget_record
        budget_record.status = FinanceBudget.Status.ARCHIVED
        try:
            budget_record.save()
        except ValidationError as exc:
            raise ValidationException("Budget data is invalid.", details=exc.message_dict) from exc
        return budget_record
