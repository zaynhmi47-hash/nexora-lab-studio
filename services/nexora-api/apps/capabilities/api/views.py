from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.capabilities.api.serializers import CapabilitySerializer
from apps.capabilities.models import Capability
from apps.capabilities.selectors import get_capability_by_id, get_product_capabilities, list_capabilities
from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NotFoundException, NexoraException, PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.products.selectors import get_product_by_id


class CapabilityAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Capability access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details, correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class CapabilityListView(CapabilityAPIView):
    def get(self, request):
        queryset = list_capabilities(status=request.query_params.get("status", Capability.Status.ACTIVE), key=request.query_params.get("key"), product=request.query_params.get("product"))
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(CapabilitySerializer(page_results, many=True).data)
        return success_response(CapabilitySerializer(queryset, many=True).data)


class CapabilityDetailView(CapabilityAPIView):
    def get(self, request, capability_id):
        capability = get_capability_by_id(capability_id)
        if capability is None:
            return self._error(request, NotFoundException("Capability not found."))
        return success_response(CapabilitySerializer(capability).data)


class ProductCapabilityListView(CapabilityAPIView):
    def get(self, request, product_id):
        if get_product_by_id(product_id) is None:
            return self._error(request, NotFoundException("Product not found."))
        capabilities = get_product_capabilities(product_id)
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(capabilities, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(CapabilitySerializer(page_results, many=True).data)
        return success_response(CapabilitySerializer(capabilities, many=True).data)
