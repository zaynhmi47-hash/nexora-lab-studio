from django.urls import path

from apps.finance.api.summary_views import FinanceSummaryView
from apps.finance.api.views import FinanceTransactionListView

urlpatterns = [
    path("", FinanceTransactionListView.as_view(), name="finance-transaction-list"),
    path("summary/", FinanceSummaryView.as_view(), name="finance-summary"),
]
