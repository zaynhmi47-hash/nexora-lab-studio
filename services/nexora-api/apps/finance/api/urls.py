from django.urls import path

from apps.finance.api.views import FinanceTransactionListView

urlpatterns = [
    path("", FinanceTransactionListView.as_view(), name="finance-transaction-list"),
]
