from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NotFoundException, NexoraException, PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.products.api.serializers import ProductSerializer
from apps.products.models import Product
from apps.products.selectors import get_product_by_id, list_products


class ProductAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Product access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details, correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class ProductListView(ProductAPIView):
    def get(self, request):
        status = request.query_params.get("status", Product.Status.ACTIVE)
        product_type = request.query_params.get("product_type")
        key = request.query_params.get("key")
        queryset = list_products(status=status, product_type=product_type, key=key)
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(ProductSerializer(page_results, many=True).data)
        return success_response(ProductSerializer(queryset, many=True).data)


class ProductDetailView(ProductAPIView):
    def get(self, request, product_id):
        product = get_product_by_id(product_id)
        if product is None:
            return self._error(request, NotFoundException("Product not found."))
        return success_response(ProductSerializer(product).data)
