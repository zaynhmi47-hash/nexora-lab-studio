# backend/apps/finance/serializers.py

from rest_framework import serializers
from .models import Category, Transaction, Budget, SavingsGoal


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'category_type', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'category', 'category_name', 'category_color',
            'amount', 'transaction_type', 'payment_method',
            'title', 'description', 'date',
            'from_account', 'to_account',
            'receipt_image', 'tags',
            'latitude', 'longitude', 'location_name',
            'is_recurring', 'recurring_pattern',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name',
            'amount', 'period', 'start_date', 'end_date',
            'alert_percentage', 'is_active',
            'spent_amount', 'remaining_amount', 'usage_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_spent_amount(self, obj):
        from django.db.models import Sum
        transactions = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='EXPENSE',
            date__gte=obj.start_date,
            date__lte=obj.end_date
        )
        total = transactions.aggregate(total=Sum('amount'))['total'] or 0
        return total
    
    def get_remaining_amount(self, obj):
        spent = self.get_spent_amount(obj)
        return obj.amount - spent
    
    def get_usage_percentage(self, obj):
        spent = self.get_spent_amount(obj)
        if obj.amount == 0:
            return 0
        return min(100, float((spent / obj.amount) * 100))


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'name', 'target_amount', 'current_amount',
            'deadline', 'status', 'description', 'icon',
            'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress_percentage', 'created_at', 'updated_at']