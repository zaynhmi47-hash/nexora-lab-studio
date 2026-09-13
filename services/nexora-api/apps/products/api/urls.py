from django.urls import path

from apps.products.api.views import ProductDetailView, ProductListView

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("<uuid:product_id>/", ProductDetailView.as_view(), name="product-detail"),
]
