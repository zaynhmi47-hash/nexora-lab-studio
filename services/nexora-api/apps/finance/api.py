from __future__ import annotations

from django.utils.dateparse import parse_datetime
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import NexoraException
from apps.identity.authentication import FirebaseIdentityAuthentication

from .serializers import TransactionCreateSerializer
from .services import FinanceService


class CanReadFinance(NexoraPermission):
    required_permission = "finance.transactions.read"


class CanCreateFinance(NexoraPermission):
    required_permission = "finance.transactions.create"


class TransactionView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]

    def get_permissions(self):
        permission_classes = [IsAuthenticated, CanCreateFinance] if self.request.method == "POST" else [
            IsAuthenticated,
            CanReadFinance,
        ]
        return [permission() for permission in permission_classes]

    def _error(self, request, exception: NexoraException):
        return error_response(
            exception.code,
            exception.message,
            details=exception.details,
            correlation_id=getattr(request, "correlation_id", None),
            status=exception.status_code,
        )

    def get(self, request, organization_id):
        try:
            occurred_from = self._parse_date(request.query_params.get("from"))
            occurred_to = self._parse_date(request.query_params.get("to"))
            if occurred_from and occurred_to and occurred_from >= occurred_to:
                return error_response("validation.error", "from must be earlier than to.", status=400)
            transaction_type = request.query_params.get("transaction_type")
            if transaction_type and transaction_type not in {"income", "expense"}:
                return error_response("validation.error", "transaction_type must be income or expense.", status=400)

            transactions = FinanceService.list_transactions(
                user=request.user,
                organization_id=organization_id,
                transaction_type=transaction_type,
                category=request.query_params.get("category"),
                occurred_from=occurred_from,
                occurred_to=occurred_to,
            )
            data = [self._serialize(item) for item in transactions[:100]]
            return success_response(data, meta={"count": len(data), "limit": 100})
        except ValueError:
            return error_response("validation.error", "Invalid transaction date filter.", status=400)
        except NexoraException as exception:
            return self._error(request, exception)

    def post(self, request, organization_id):
        serializer = TransactionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "validation.error",
                "Invalid finance transaction payload.",
                details=serializer.errors,
                correlation_id=getattr(request, "correlation_id", None),
                status=400,
            )

        try:
            transaction = FinanceService.create_transaction(
                user=request.user,
                organization_id=organization_id,
                **serializer.validated_data,
            )
            return success_response(self._serialize(transaction), status=201)
        except NexoraException as exception:
            return self._error(request, exception)

    @staticmethod
    def _parse_date(value: str | None):
        if not value:
            return None
        parsed = parse_datetime(value)
        if parsed is None:
            raise ValueError("Invalid datetime")
        return parsed

    @staticmethod
    def _serialize(transaction):
        return {
            "id": str(transaction.id),
            "organization_id": str(transaction.organization_id),
            "transaction_type": transaction.transaction_type,
            "amount": str(transaction.amount),
            "currency": transaction.currency,
            "category": transaction.category,
            "description": transaction.description,
            "occurred_at": transaction.occurred_at.isoformat(),
            "created_at": transaction.created_at.isoformat(),
        }
