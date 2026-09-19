from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance, CanWriteFinance
from apps.core.api.pagination import CorePageNumberPagination
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.finance.api.budget_serializers import (
    FinanceBudgetListQuerySerializer,
    FinanceBudgetSerializer,
    FinanceBudgetUpdateSerializer,
)
from apps.finance.selectors.budget_selectors import get_budget_by_id, list_budgets
from apps.finance.services.budget_service import FinanceBudgetService
from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.organizations.selectors import get_active_membership


class FinanceBudgetAPIView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]

    def get_permissions(self):
        permission = CanWriteFinance if self.request.method in {"POST", "PATCH", "PUT", "DELETE"} else CanReadFinance
        return [IsAuthenticated(), permission()]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance budget access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(exception.code, exception.message, details=exception.details,
                              correlation_id=getattr(request, "correlation_id", None), status=exception.status_code)


class FinanceBudgetListView(FinanceBudgetAPIView):
    def get(self, request, organization_id):
        query = FinanceBudgetListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        queryset = list_budgets(organization_id=organization_id, **query.validated_data)
        page = CorePageNumberPagination()
        page_results = page.paginate_queryset(queryset, request, view=self)
        if page_results is not None:
            return page.get_paginated_response(FinanceBudgetSerializer(page_results, many=True).data)
        return success_response(FinanceBudgetSerializer(queryset, many=True).data)

    def post(self, request, organization_id):
        membership = get_active_membership(user=request.user, organization_id=organization_id)
        if membership is None:
            return self._error(request, PermissionDeniedException("Active organization membership is required."))
        serializer = FinanceBudgetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = FinanceBudgetService.create_budget(
            organization=membership.organization, **serializer.validated_data,
        )
        return success_response(FinanceBudgetSerializer(record).data, status=201)


class FinanceBudgetDetailView(FinanceBudgetAPIView):
    def _get_record(self, organization_id, budget_id):
        record = get_budget_by_id(organization_id=organization_id, budget_id=budget_id)
        if record is None:
            raise NotFound("Budget not found.")
        return record

    def get(self, request, organization_id, budget_id):
        return success_response(FinanceBudgetSerializer(self._get_record(organization_id, budget_id)).data)

    def patch(self, request, organization_id, budget_id):
        record = self._get_record(organization_id, budget_id)
        serializer = FinanceBudgetUpdateSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = FinanceBudgetService.update_budget(
            budget_record=record, **serializer.validated_data,
        )
        return success_response(FinanceBudgetSerializer(updated).data)

    def delete(self, request, organization_id, budget_id):
        record = self._get_record(organization_id, budget_id)
        archived = FinanceBudgetService.archive_budget(budget_record=record)
        return success_response(FinanceBudgetSerializer(archived).data)
