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
