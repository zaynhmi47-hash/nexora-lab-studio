from rest_framework import serializers


class FinanceComparisonQuerySerializer(serializers.Serializer):
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


class FinanceComparisonMetricSerializer(serializers.Serializer):
    current = serializers.IntegerField()
    previous = serializers.IntegerField()
    delta = serializers.IntegerField()
    percentage_change = serializers.FloatField(allow_null=True)


class FinanceComparisonSerializer(serializers.Serializer):
    current_start_date = serializers.DateField()
    current_end_date = serializers.DateField()
    previous_start_date = serializers.DateField()
    previous_end_date = serializers.DateField()
    currency = serializers.CharField()
    income = FinanceComparisonMetricSerializer()
    expense = FinanceComparisonMetricSerializer()
    net_cash_flow = FinanceComparisonMetricSerializer()
    transaction_count = FinanceComparisonMetricSerializer()
