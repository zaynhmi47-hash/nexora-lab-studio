from __future__ import annotations

from datetime import datetime

from django.utils.dateparse import parse_datetime
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
            occurred_from = self._parse_date(request.query_params.get("from"))
            occurred_to = self._parse_date(request.query_params.get("to"))
            if occurred_from and occurred_to and occurred_from >= occurred_to:
                return error_response("validation.error", "from must be earlier than to.", status=400)

            summary = FinanceService.summarize_transactions(
                user=request.user,
                organization_id=organization_id,
                occurred_from=occurred_from,
                occurred_to=occurred_to,
                currency=request.query_params.get("currency", "IDR"),
            )
            return success_response({
                "income": str(summary["income"]),
                "expense": str(summary["expense"]),
                "net": str(summary["net"]),
                "currency": summary["currency"],
            })
        except ValueError:
            return error_response("validation.error", "Invalid dashboard date or currency.", status=400)
        except NexoraException as exception:
            return error_response(
                exception.code,
                exception.message,
                details=exception.details,
                status=exception.status_code,
            )

    @staticmethod
    def _parse_date(value: str | None) -> datetime | None:
        if not value:
            return None
        parsed = parse_datetime(value)
        if parsed is None:
            raise ValueError("Invalid datetime")
        return parsed
