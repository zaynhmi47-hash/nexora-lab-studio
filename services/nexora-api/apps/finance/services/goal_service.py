from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.exceptions import ConflictException, ValidationException
from apps.finance.models import FinanceGoal, FinanceGoalContribution


class FinanceGoalService:
    @staticmethod
    @transaction.atomic
    def create_goal(*, organization, **data) -> FinanceGoal:
        record = FinanceGoal(organization=organization, **data)
        try:
            record.save()
        except ValidationError as exc:
            raise ValidationException("Goal data is invalid.", details=exc.message_dict) from exc
        return record

    @staticmethod
    @transaction.atomic
    def update_goal(*, goal_record: FinanceGoal, **changes) -> FinanceGoal:
        if goal_record.status == FinanceGoal.Status.ARCHIVED:
            raise ValidationException("Archived goals cannot be edited.")
        for field, value in changes.items():
            setattr(goal_record, field, value)
        try:
            goal_record.save()
        except ValidationError as exc:
            raise ValidationException("Goal data is invalid.", details=exc.message_dict) from exc
        return goal_record

    @staticmethod
    @transaction.atomic
    def archive_goal(*, goal_record: FinanceGoal) -> FinanceGoal:
        if goal_record.status == FinanceGoal.Status.ARCHIVED:
            return goal_record
        goal_record.status = FinanceGoal.Status.ARCHIVED
        try:
            goal_record.save()
        except ValidationError as exc:
            raise ValidationException("Goal data is invalid.", details=exc.message_dict) from exc
        return goal_record

    @staticmethod
    @transaction.atomic
    def create_contribution(*, organization, goal, **data) -> FinanceGoalContribution:
        if goal.organization_id != organization.id:
            raise ValidationException("Goal does not belong to the active organization.")
        if goal.status == FinanceGoal.Status.ARCHIVED:
            raise ValidationException("Archived goals cannot receive contributions.")
        record = FinanceGoalContribution(organization=organization, goal=goal, **data)
        try:
            record.save()
        except IntegrityError as exc:
            raise ConflictException("A contribution with this idempotency key already exists.") from exc
        except ValidationError as exc:
            raise ValidationException("Contribution data is invalid.", details=exc.message_dict) from exc
        return record

    @staticmethod
    @transaction.atomic
    def void_contribution(*, contribution_record: FinanceGoalContribution) -> FinanceGoalContribution:
        if contribution_record.status == FinanceGoalContribution.Status.VOID:
            return contribution_record
        contribution_record.status = FinanceGoalContribution.Status.VOID
        try:
            contribution_record.save()
        except ValidationError as exc:
            raise ValidationException("Contribution data is invalid.", details=exc.message_dict) from exc
        return contribution_record
