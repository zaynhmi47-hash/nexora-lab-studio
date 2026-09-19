from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.finance.api.profit_loss_serializers import (
    FinanceProfitLossQuerySerializer,
    FinanceProfitLossSerializer,
)
from apps.finance.selectors.profit_loss_selectors import get_finance_profit_loss
from apps.identity.authentication import FirebaseIdentityAuthentication


class FinanceProfitLossView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, CanReadFinance]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance profit & loss access is denied."))
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
        query = FinanceProfitLossQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        report = get_finance_profit_loss(
            organization_id=organization_id,
            **query.validated_data,
        )
        return success_response(FinanceProfitLossSerializer(report).data)
