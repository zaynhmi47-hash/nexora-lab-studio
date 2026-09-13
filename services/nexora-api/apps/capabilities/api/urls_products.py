from django.urls import path

from apps.capabilities.api.views import ProductCapabilityListView

urlpatterns = [
    path("<uuid:product_id>/capabilities/", ProductCapabilityListView.as_view(), name="product-capability-list"),
]
