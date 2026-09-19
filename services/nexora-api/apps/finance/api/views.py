from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance, CanWriteFinance
from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.finance.api.serializers import (
    FinanceTransactionListQuerySerializer,
    FinanceTransactionSerializer,
    FinanceTransactionUpdateSerializer,
)
from apps.finance.selectors import get_transaction_by_id, list_transactions
from apps.finance.services import FinanceTransactionService
from apps.organizations.selectors import get_active_membership


class FinanceTransactionAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]

    def get_permissions(self):
        permission = CanWriteFinance if self.request.method in {"POST", "PATCH", "PUT", "DELETE"} else CanReadFinance
        return [IsAuthenticated(), permission()]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance transaction access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details,
                              correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class FinanceTransactionListView(FinanceTransactionAPIView):
    def get(self, request, organization_id):
        query = FinanceTransactionListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        queryset = list_transactions(organization_id=organization_id, **query.validated_data)
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
        record = FinanceTransactionService.create_transaction(
            organization=membership.organization, **serializer.validated_data,
        )
        return success_response(FinanceTransactionSerializer(record).data, status=201)


class FinanceTransactionDetailView(FinanceTransactionAPIView):
    def _get_record(self, request, organization_id, transaction_id):
        record = get_transaction_by_id(organization_id=organization_id, transaction_id=transaction_id)
        if record is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Transaction not found.")
        return record

    def get(self, request, organization_id, transaction_id):
        return success_response(FinanceTransactionSerializer(
            self._get_record(request, organization_id, transaction_id)
        ).data)

    def patch(self, request, organization_id, transaction_id):
        record = self._get_record(request, organization_id, transaction_id)
        serializer = FinanceTransactionUpdateSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = FinanceTransactionService.update_transaction(
            transaction_record=record, **serializer.validated_data,
        )
        return success_response(FinanceTransactionSerializer(updated).data)

    def delete(self, request, organization_id, transaction_id):
        record = self._get_record(request, organization_id, transaction_id)
        voided = FinanceTransactionService.void_transaction(transaction_record=record)
        return success_response(FinanceTransactionSerializer(voided).data)
