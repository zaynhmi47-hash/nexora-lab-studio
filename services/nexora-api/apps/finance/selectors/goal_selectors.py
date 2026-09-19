from __future__ import annotations

from datetime import date

from django.db.models import BigIntegerField, Count, Sum, Value
from django.db.models.functions import Coalesce

from apps.finance.models import FinanceGoal, FinanceGoalContribution


def _goal_progress(goal: FinanceGoal, *, today: date) -> dict:
    zero = Value(0, output_field=BigIntegerField())
    aggregate = FinanceGoalContribution.objects.active().filter(
        organization_id=goal.organization_id,
        goal_id=goal.id,
        status=FinanceGoalContribution.Status.POSTED,
    ).aggregate(
        current_amount_minor=Coalesce(Sum("amount_minor"), zero),
        contribution_count=Count("id"),
    )
    current = int(aggregate["current_amount_minor"] or 0)
    remaining = max(goal.target_amount_minor - current, 0)
    progress = min(current / goal.target_amount_minor * 100, 100) if goal.target_amount_minor else None
    if goal.status == FinanceGoal.Status.ARCHIVED:
        derived_status = "archived"
    elif current >= goal.target_amount_minor:
        derived_status = "completed"
    elif goal.status == FinanceGoal.Status.PAUSED:
        derived_status = "paused"
    elif goal.target_date < today:
        derived_status = "overdue"
    else:
        derived_status = "active"
    return {
        "goal_id": goal.id, "name": goal.name,
        "target_amount_minor": goal.target_amount_minor,
        "current_amount_minor": current, "remaining_amount_minor": remaining,
        "progress_percentage": progress, "start_date": goal.start_date,
        "target_date": goal.target_date, "status": derived_status,
        "configured_status": goal.status, "currency": goal.currency,
        "contribution_count": aggregate["contribution_count"],
        "days_remaining": max((goal.target_date - today).days, 0),
    }


def list_goals(*, organization_id, status=None):
    return FinanceGoal.objects.active().filter(
        organization_id=organization_id, **({"status": status} if status else {})
    )


def get_goal_by_id(*, organization_id, goal_id):
    return FinanceGoal.objects.active().filter(organization_id=organization_id, id=goal_id).first()


def get_goal_progress(*, goal, today=None):
    return _goal_progress(goal, today=today or date.today())


def get_finance_goal_summary(*, organization_id, today=None):
    items = [_goal_progress(goal, today=today or date.today()) for goal in list_goals(organization_id=organization_id)]
    return {
        "currency": "IDR", "goal_count": len(items),
        "active_count": sum(item["status"] == "active" for item in items),
        "completed_count": sum(item["status"] == "completed" for item in items),
        "overdue_count": sum(item["status"] == "overdue" for item in items),
        "total_target_amount_minor": sum(item["target_amount_minor"] for item in items if item["status"] != "archived"),
        "total_current_amount_minor": sum(item["current_amount_minor"] for item in items if item["status"] != "archived"),
        "goals": items,
    }


def list_goal_contributions(*, organization_id, goal_id):
    return FinanceGoalContribution.objects.active().filter(
        organization_id=organization_id, goal_id=goal_id,
    )


def get_goal_contribution_by_id(*, organization_id, goal_id, contribution_id):
    return list_goal_contributions(
        organization_id=organization_id, goal_id=goal_id,
    ).filter(id=contribution_id).first()
