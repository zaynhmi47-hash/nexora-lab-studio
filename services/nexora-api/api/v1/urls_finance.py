from django.urls import path

from apps.finance.api import TransactionView
from apps.finance.dashboard import FinanceDashboardView

urlpatterns = [
    path("transactions/", TransactionView.as_view(), name="finance-transactions"),
    path("dashboard/", FinanceDashboardView.as_view(), name="finance-dashboard"),
]
