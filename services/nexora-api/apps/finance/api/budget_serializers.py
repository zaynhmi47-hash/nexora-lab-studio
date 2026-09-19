from rest_framework import serializers

from apps.finance.models import FinanceBudget


class FinanceBudgetSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    organization_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = FinanceBudget
        fields = (
            "id", "organization_id", "name", "category", "amount_minor", "currency",
            "start_date", "end_date", "status", "metadata", "created_at", "updated_at",
        )
        read_only_fields = ("id", "organization_id", "status", "created_at", "updated_at")

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        return attrs


class FinanceBudgetListQuerySerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=FinanceBudget.Status.choices, required=False)
    category = serializers.CharField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        return attrs


class FinanceBudgetUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceBudget
        fields = ("name", "category", "amount_minor", "currency", "start_date", "end_date", "metadata")

    def validate(self, attrs):
        instance = self.instance
        if instance is not None and instance.status == FinanceBudget.Status.ARCHIVED:
            raise serializers.ValidationError("Archived budgets cannot be edited.")
        start_date = attrs.get("start_date", instance.start_date)
        end_date = attrs.get("end_date", instance.end_date)
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "end_date must be on or after start_date."})
        return attrs
