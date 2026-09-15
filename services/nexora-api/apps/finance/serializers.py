from __future__ import annotations

from rest_framework import serializers

from .models import Transaction


class TransactionCreateSerializer(serializers.Serializer):
    transaction_type = serializers.ChoiceField(choices=Transaction.TransactionType.choices)
    amount = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(required=False, default="IDR", max_length=3, min_length=3)
    category = serializers.CharField(max_length=100, trim_whitespace=True)
    description = serializers.CharField(required=False, default="", allow_blank=True, max_length=255)
    occurred_at = serializers.DateTimeField()

    def validate_currency(self, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) != 3 or not normalized.isalpha():
            raise serializers.ValidationError("currency must be a 3-letter ISO currency code.")
        return normalized

    def validate_category(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("category is required.")
        return normalized

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be greater than zero.")
        return value
