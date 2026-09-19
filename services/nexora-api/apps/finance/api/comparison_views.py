from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.finance.api.comparison_serializers import (
    FinanceComparisonMetricSerializer,
    FinanceComparisonQuerySerializer,
    FinanceComparisonSerializer,
)
from apps.finance.selectors.comparison_selectors import get_finance_period_comparison
from apps.identity.authentication import FirebaseIdentityAuthentication


class FinancePeriodComparisonView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, CanReadFinance]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance reporting access is denied."))
        return super().handle_exception(exc)

    @staticmethod
    def _error(request, exception: NexoraException):
        return error_response(
            exception.code,
            exception.message,
            details=exception.details,
            correlation_id=getattr(request, "correlation_id", None),
            status=exception.status_code,
        )

    def get(self, request, organization_id):
        query = FinanceComparisonQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        comparison = get_finance_period_comparison(
            organization_id=organization_id,
            **query.validated_data,
        )
        data = FinanceComparisonSerializer(comparison).data
        for key in ("income", "expense", "net_cash_flow", "transaction_count"):
            data[key] = FinanceComparisonMetricSerializer(comparison[key]).data

        return success_response(
            data,
            meta={
                "current_start_date": query.validated_data["start_date"],
                "current_end_date": query.validated_data["end_date"],
                "currency": "IDR",
            },
        )
