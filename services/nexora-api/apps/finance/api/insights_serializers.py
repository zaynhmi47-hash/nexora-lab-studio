from rest_framework import serializers


class FinanceInsightsQuerySerializer(serializers.Serializer):
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


class FinanceInsightSerializer(serializers.Serializer):
    code = serializers.CharField()
    severity = serializers.ChoiceField(choices=("info", "warning"))
    title = serializers.CharField()
    message = serializers.CharField()
    metric = serializers.CharField()
    value_minor = serializers.IntegerField(allow_null=True)
    delta_minor = serializers.IntegerField(allow_null=True)
    percentage_change = serializers.FloatField(allow_null=True)
    category = serializers.CharField(allow_null=True, allow_blank=True)


class FinanceInsightsSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    currency = serializers.CharField()
    insights = FinanceInsightSerializer(many=True)
