# backend/apps/finance/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Category, Transaction, Budget, SavingsGoal
from .serializers import (
    CategorySerializer, 
    TransactionSerializer, 
    BudgetSerializer, 
    SavingsGoalSerializer
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Filter by type
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset.order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial summary"""
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        
        income = Transaction.objects.filter(
            user=request.user,
            transaction_type='INCOME',
            date__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense = Transaction.objects.filter(
            user=request.user,
            transaction_type='EXPENSE',
            date__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        balance = income - expense
        
        return Response({
            'income': float(income),
            'expense': float(expense),
            'balance': float(balance),
            'month': now.strftime('%B %Y')
        })
    
    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """Get data for charts"""
        period = request.query_params.get('period', 'monthly')
        
        if period == 'weekly':
            days = 7
        elif period == 'monthly':
            days = 30
        else:
            days = 90
        
        start_date = timezone.now() - timedelta(days=days)
        
        expenses_by_category = Transaction.objects.filter(
            user=request.user,
            transaction_type='EXPENSE',
            date__gte=start_date
        ).values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        daily_expenses = Transaction.objects.filter(
            user=request.user,
            transaction_type='EXPENSE',
            date__gte=start_date
        ).extra(select={'day': "DATE(date)"}).values('day').annotate(
            total=Sum('amount')
        ).order_by('day')
        
        return Response({
            'expenses_by_category': list(expenses_by_category),
            'daily_expenses': list(daily_expenses)
        })


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)