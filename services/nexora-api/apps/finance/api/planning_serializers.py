from rest_framework import serializers


class FinancePlanningQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        from apps.finance.selectors.summary_selectors import get_current_month_period

        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date is None and end_date is None:
            start_date, end_date = get_current_month_period()
        elif start_date is None:
            start_date, _ = get_current_month_period(today=end_date)
        elif end_date is None:
            end_date = start_date

        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})

        attrs["start_date"] = start_date
        attrs["end_date"] = end_date
        return attrs


class FinancePlanningBudgetItemSerializer(serializers.Serializer):
    budget_id = serializers.UUIDField()
    name = serializers.CharField()
    category = serializers.CharField()
    budget_minor = serializers.IntegerField()
    actual_minor = serializers.IntegerField()
    remaining_minor = serializers.IntegerField()
    utilization_percentage = serializers.FloatField(allow_null=True)
    status = serializers.CharField()
    transaction_count = serializers.IntegerField()


class FinancePlanningGoalItemSerializer(serializers.Serializer):
    goal_id = serializers.UUIDField()
    name = serializers.CharField()
    target_amount_minor = serializers.IntegerField()
    current_amount_minor = serializers.IntegerField()
    remaining_amount_minor = serializers.IntegerField()
    progress_percentage = serializers.FloatField(allow_null=True)
    start_date = serializers.DateField()
    target_date = serializers.DateField()
    planned_saving_minor = serializers.IntegerField()
    saving_gap_minor = serializers.IntegerField()
    days_remaining = serializers.IntegerField()
    status = serializers.ChoiceField(choices=("active", "overdue", "completed"))


class FinancePlanningSummarySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    currency = serializers.CharField()
    actual_income_minor = serializers.IntegerField()
    actual_expense_minor = serializers.IntegerField()
    actual_net_cash_flow_minor = serializers.IntegerField()
    planned_spending_minor = serializers.IntegerField()
    planned_saving_minor = serializers.IntegerField()
    actual_goal_contribution_minor = serializers.IntegerField()
    planned_spending_gap_minor = serializers.IntegerField()
    saving_gap_minor = serializers.IntegerField()
    projected_cash_after_plans_minor = serializers.IntegerField()
    active_goal_count = serializers.IntegerField()
    over_budget_count = serializers.IntegerField()
    planning_status = serializers.ChoiceField(
        choices=("on_track", "saving_gap", "budget_overage", "over_planned"),
    )
    budget_items = FinancePlanningBudgetItemSerializer(many=True)
    goal_items = FinancePlanningGoalItemSerializer(many=True)
