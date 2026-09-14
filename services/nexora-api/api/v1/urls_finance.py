from django.urls import path

from apps.finance.api import TransactionView

urlpatterns = [
    path("transactions/", TransactionView.as_view(), name="finance-transactions"),
]
