from decimal import Decimal, InvalidOperation

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import ZakatService


def serialize(item):
    return {
        "id": str(item.id),
        "assets": str(item.assets),
        "debts": str(item.debts),
        "nisab": str(item.nisab),
        "rate": str(item.rate),
        "zakatableAmount": str(item.zakatable_amount),
        "zakatAmount": str(item.zakat_amount),
        "currency": item.currency,
        "createdAt": item.created_at.isoformat(),
    }


class ZakatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response([serialize(item) for item in ZakatService.history(request.user)])

    def post(self, request):
        try:
            item = ZakatService.calculate(
                request.user,
                request.data.get("assets", 0),
                request.data.get("debts", 0),
                request.data.get("nisab", 0),
                request.data.get("currency", "IDR"),
                request.data.get("rate", "0.025"),
            )
        except (ValueError, InvalidOperation, TypeError):
            return Response({"detail": "Invalid zakat values."}, status=400)
        return Response(serialize(item), status=201)
