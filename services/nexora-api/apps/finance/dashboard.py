from __future__ import annotations

from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import NexoraException
from apps.identity.authentication import FirebaseIdentityAuthentication

from .services import FinanceService


class CanReadFinanceDashboard(NexoraPermission):
    required_permission = "finance.transactions.read"


class FinanceDashboardView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, CanReadFinanceDashboard]

    def get(self, request, organization_id):
        try:
            summary = FinanceService.summarize_transactions(
                user=request.user,
                organization_id=organization_id,
                occurred_from=request.query_params.get("from"),
                occurred_to=request.query_params.get("to"),
            )
            data = {
                "income": str(summary["income"]),
                "expense": str(summary["expense"]),
                "net": str(summary["net"]),
                "currency": summary["currency"],
            }
            return success_response(data)
        except (TypeError, ValueError) as exc:
            return error_response("validation.error", "Invalid dashboard date range.", status=400)
        except NexoraException as exception:
            return error_response(exception.code, exception.message, details=exception.details, status=exception.status_code)
