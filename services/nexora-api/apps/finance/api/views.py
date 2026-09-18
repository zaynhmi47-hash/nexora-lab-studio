from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance, CanWriteFinance
from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.finance.api.serializers import FinanceTransactionSerializer
from apps.finance.selectors import list_transactions
from apps.finance.services import FinanceTransactionService
from apps.organizations.selectors import get_active_membership


class FinanceTransactionAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]

    def get_permissions(self):
        permission = CanWriteFinance if self.request.method == "POST" else CanReadFinance
        return [IsAuthenticated(), permission()]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance transaction access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details, correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class FinanceTransactionListView(FinanceTransactionAPIView):
    def get(self, request, organization_id):
        queryset = list_transactions(
            organization_id=organization_id,
            direction=request.query_params.get("direction"),
            status=request.query_params.get("status"),
        )
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(FinanceTransactionSerializer(page_results, many=True).data)
        return success_response(FinanceTransactionSerializer(queryset, many=True).data)

    def post(self, request, organization_id):
        membership = get_active_membership(user=request.user, organization_id=organization_id)
        if membership is None:
            return self._error(request, PermissionDeniedException("Active organization membership is required."))
        serializer = FinanceTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        transaction_record = FinanceTransactionService.create_transaction(
            organization=membership.organization,
            **serializer.validated_data,
        )
        return success_response(FinanceTransactionSerializer(transaction_record).data, status=201)
