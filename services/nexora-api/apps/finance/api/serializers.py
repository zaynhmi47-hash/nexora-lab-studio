from rest_framework import serializers

from apps.finance.models import FinanceTransaction


class FinanceTransactionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    organization_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = FinanceTransaction
        fields = (
            "id", "organization_id", "direction", "amount_minor", "currency", "category",
            "description", "occurred_at", "status", "reference", "idempotency_key",
            "metadata", "created_at", "updated_at",
        )
        read_only_fields = ("id", "organization_id", "status", "created_at", "updated_at")
        extra_kwargs = {"idempotency_key": {"write_only": True, "required": False}}


class FinanceTransactionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceTransaction
        fields = (
            "direction", "amount_minor", "currency", "category", "description",
            "occurred_at", "reference", "metadata",
        )

    def validate(self, attrs):
        instance = self.instance
        if instance is not None and instance.status == FinanceTransaction.Status.VOID:
            raise serializers.ValidationError("Void transactions cannot be edited.")
        return attrs


class FinanceTransactionListQuerySerializer(serializers.Serializer):
    direction = serializers.ChoiceField(choices=FinanceTransaction.Direction.choices, required=False)
    status = serializers.ChoiceField(choices=FinanceTransaction.Status.choices, required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        return attrs


class FinanceCategoryBreakdownQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date is None and end_date is None:
            from apps.finance.selectors.summary_selectors import get_current_month_period
            start_date, end_date = get_current_month_period()
        elif start_date is None:
            from apps.finance.selectors.summary_selectors import get_current_month_period
            start_date, _ = get_current_month_period(today=end_date)
        elif end_date is None:
            end_date = start_date
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        attrs["start_date"] = start_date
        attrs["end_date"] = end_date
        return attrs


class FinanceCategoryBreakdownSerializer(serializers.Serializer):
    category = serializers.CharField()
    direction = serializers.ChoiceField(choices=FinanceTransaction.Direction.choices)
    amount_minor = serializers.IntegerField()
    transaction_count = serializers.IntegerField()
