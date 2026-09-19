from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import CanReadFinance
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import AuthenticationException, NexoraException, PermissionDeniedException
from apps.finance.api.insights_serializers import (
    FinanceInsightSerializer,
    FinanceInsightsQuerySerializer,
    FinanceInsightsSerializer,
)
from apps.finance.selectors.insights_selectors import get_finance_insights
from apps.identity.authentication import FirebaseIdentityAuthentication


class FinanceInsightsView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, CanReadFinance]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return self._error(self.request, AuthenticationException("Authentication is required."))
        if isinstance(exc, PermissionDenied):
            return self._error(self.request, PermissionDeniedException("Finance insights access is denied."))
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
        query = FinanceInsightsQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        report = get_finance_insights(
            organization_id=organization_id,
            **query.validated_data,
        )
        return success_response(
            FinanceInsightsSerializer(report).data,
            meta={
                "start_date": query.validated_data["start_date"],
                "end_date": query.validated_data["end_date"],
                "currency": "IDR",
            },
        )
