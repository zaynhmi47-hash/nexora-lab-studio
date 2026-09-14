from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation

from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.core.api.response import error_response, success_response
from apps.core.exceptions import NexoraException, ValidationException
from apps.identity.authentication import FirebaseIdentityAuthentication

from .services import FinanceService


class CanReadFinance(NexoraPermission):
    required_permission = "finance.transactions.read"


class CanCreateFinance(NexoraPermission):
    required_permission = "finance.transactions.create"


class TransactionView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, CanReadFinance]

    def _error(self, request, exception: NexoraException):
        return error_response(
            exception.code,
            exception.message,
            details=exception.details,
            correlation_id=getattr(request, "correlation_id", None),
            status=exception.status_code,
        )

    def get(self, request, organization_id):
        transactions = FinanceService.list_transactions(user=request.user, organization_id=organization_id)
        data = [self._serialize(item) for item in transactions[:100]]
        return success_response(data, meta={"count": len(data), "limit": 100})

    def post(self, request, organization_id):
        if not CanCreateFinance().has_permission(request, self):
            return error_response("permission.denied", "Finance transaction creation permission is required.", status=403)
        try:
            payload = request.data
            amount = Decimal(str(payload.get("amount", "0")))
            occurred_at = datetime.fromisoformat(str(payload.get("occurred_at", "")).replace("Z", "+00:00"))
            transaction = FinanceService.create_transaction(
                user=request.user,
                organization_id=organization_id,
                transaction_type=str(payload.get("transaction_type", "")),
                amount=amount,
                currency=str(payload.get("currency", "IDR")),
                category=str(payload.get("category", "")),
                description=str(payload.get("description", "")),
                occurred_at=occurred_at,
            )
            return success_response(self._serialize(transaction), status=201)
        except (InvalidOperation, ValueError) as exc:
            return self._error(request, ValidationException("amount and occurred_at must be valid."))
        except NexoraException as exception:
            return self._error(request, exception)

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
