from rest_framework import serializers


class FinanceProfitLossQuerySerializer(serializers.Serializer):
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
            raise serializers.ValidationError(
                {"end_date": "end_date must be on or after start_date."}
            )

        attrs["start_date"] = start_date
        attrs["end_date"] = end_date
        return attrs


class FinanceProfitLossLineSerializer(serializers.Serializer):
    category = serializers.CharField()
    amount_minor = serializers.IntegerField()
    transaction_count = serializers.IntegerField()


class FinanceProfitLossSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    currency = serializers.CharField()
    total_income_minor = serializers.IntegerField()
    total_expense_minor = serializers.IntegerField()
    net_profit_minor = serializers.IntegerField()
    income_lines = FinanceProfitLossLineSerializer(many=True)
    expense_lines = FinanceProfitLossLineSerializer(many=True)
