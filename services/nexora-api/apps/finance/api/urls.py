from django.urls import path

from apps.finance.api.views import FinanceTransactionDetailView, FinanceTransactionListView

urlpatterns = [
    path("", FinanceTransactionListView.as_view(), name="finance-transaction-list"),
    path("<uuid:transaction_id>/", FinanceTransactionDetailView.as_view(), name="finance-transaction-detail"),
]
