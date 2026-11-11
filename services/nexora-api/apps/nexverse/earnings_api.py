from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import NexverseAuthor, NexverseRoyaltyEntry


class NexverseCreatorEarningsView(APIView):
    """Read-only author ledger scoped to the authenticated Nexora identity."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        author = NexverseAuthor.objects.filter(user=request.user).first()
        if author is None:
            return Response({"isCreator": False, "items": [], "totals": []})

        entries = (
            NexverseRoyaltyEntry.objects.filter(
                author=author,
                deleted_at__isnull=True,
            )
            .select_related("purchase", "purchase__chapter", "purchase__chapter__work")
            .order_by("-created_at", "-id")[:500]
        )
        totals_by_currency = {}
        items = []
        for entry in entries:
            totals = totals_by_currency.setdefault(
                entry.currency,
                {"currency": entry.currency, "creditedMinor": 0, "reversedMinor": 0},
            )
            if entry.entry_type == NexverseRoyaltyEntry.EntryType.CREDIT:
                totals["creditedMinor"] += entry.amount_minor
            else:
                totals["reversedMinor"] += entry.amount_minor
            items.append({
                "id": str(entry.id),
                "purchaseId": str(entry.purchase_id),
                "workId": str(entry.purchase.chapter.work_id),
                "workTitle": entry.purchase.chapter.work.title,
                "chapterId": str(entry.purchase.chapter_id),
                "chapterTitle": entry.purchase.chapter.title,
                "entryType": entry.entry_type,
                "currency": entry.currency,
                "amountMinor": entry.amount_minor,
                "createdAt": entry.created_at.isoformat(),
            })

        totals = [
            {
                **value,
                "netMinor": value["creditedMinor"] - value["reversedMinor"],
            }
            for value in totals_by_currency.values()
        ]
        return Response({
            "isCreator": True,
            "ledgerBasis": "gross_sales_before_fees_and_tax",
            "items": items,
            "totals": totals,
        })
