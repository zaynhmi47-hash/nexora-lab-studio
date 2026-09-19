from rest_framework import serializers


class FinanceBudgetSummaryQuerySerializer(serializers.Serializer):
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


class FinanceBudgetSummaryItemSerializer(serializers.Serializer):
    budget_id = serializers.UUIDField()
    name = serializers.CharField()
    category = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    budget_minor = serializers.IntegerField()
    actual_minor = serializers.IntegerField()
    remaining_minor = serializers.IntegerField()
    utilization_percentage = serializers.FloatField(allow_null=True)
    status = serializers.ChoiceField(choices=("on_track", "near_limit", "over_budget"))
    transaction_count = serializers.IntegerField()


class FinanceBudgetSummarySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    currency = serializers.CharField()
    total_budget_minor = serializers.IntegerField()
    total_actual_minor = serializers.IntegerField()
    total_remaining_minor = serializers.IntegerField()
    overall_utilization_percentage = serializers.FloatField(allow_null=True)
    over_budget_count = serializers.IntegerField()
    budgets = FinanceBudgetSummaryItemSerializer(many=True)
