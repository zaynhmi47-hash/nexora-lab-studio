from __future__ import annotations

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (
    NexverseChapter,
    NexverseChapterPrice,
    NexverseEntitlement,
    NexversePurchase,
    NexverseWork,
)


def _eligible_paid_chapters():
    return NexverseChapter.objects.filter(
        status=NexverseChapter.Status.PUBLISHED,
        is_free_preview=False,
        work__status__in=(NexverseWork.Status.PUBLISHED, NexverseWork.Status.COMPLETED),
        work__review_status=NexverseWork.ReviewStatus.APPROVED,
        work__visibility=NexverseWork.Visibility.PUBLIC,
    )


def _purchase_payload(purchase):
    return {
        "id": str(purchase.id),
        "chapterId": str(purchase.chapter_id),
        "workId": str(purchase.chapter.work_id),
        "status": purchase.status,
        "currency": purchase.currency,
        "amountMinor": purchase.amount_minor,
        "paymentProvider": purchase.payment_provider or None,
        "providerReference": purchase.provider_reference or None,
        "createdAt": purchase.created_at.isoformat(),
        "paidAt": purchase.paid_at.isoformat() if purchase.paid_at else None,
    }


class NexverseChapterOffersView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        work_id = request.query_params.get("workId")
        if not work_id:
            return Response({"detail": "workId is required."}, status=400)
        offers = (
            NexverseChapterPrice.objects.filter(
                chapter__in=_eligible_paid_chapters(),
                chapter__work_id=work_id,
                is_active=True,
                deleted_at__isnull=True,
            )
            .select_related("chapter")
            .order_by("chapter__chapter_number")
        )
        return Response({
            "items": [{
                "chapterId": str(item.chapter_id),
                "chapterNumber": item.chapter.chapter_number,
                "chapterTitle": item.chapter.title,
                "currency": item.currency,
                "amountMinor": item.amount_minor,
            } for item in offers]
        })


class NexversePurchaseListCreateView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        purchases = (
            NexversePurchase.objects.filter(user=request.user, deleted_at__isnull=True)
            .select_related("chapter")
            .order_by("-created_at")[:100]
        )
        return Response({"items": [_purchase_payload(item) for item in purchases]})

    def post(self, request):
        chapter_id = request.data.get("chapterId")
        idempotency_key = (
            request.headers.get("Idempotency-Key")
            or request.data.get("idempotencyKey")
            or ""
        )
        idempotency_key = str(idempotency_key).strip()
        if not idempotency_key or len(idempotency_key) > 128:
            return Response(
                {"detail": "A valid Idempotency-Key header (1-128 characters) is required."},
                status=400,
            )

        chapter = get_object_or_404(_eligible_paid_chapters(), pk=chapter_id)
        existing = NexversePurchase.objects.filter(
            user=request.user, idempotency_key=idempotency_key
        ).select_related("chapter").first()
        if existing:
            if existing.chapter_id != chapter.id:
                return Response(
                    {"detail": "Idempotency-Key was already used for a different purchase intent."},
                    status=409,
                )
            return Response({"item": _purchase_payload(existing)}, status=200)

        price = NexverseChapterPrice.objects.filter(
            chapter=chapter, is_active=True, deleted_at__isnull=True
        ).first()
        if price is None:
            return Response({"detail": "This chapter is not currently available for purchase."}, status=404)

        try:
            with transaction.atomic():
                purchase = NexversePurchase.objects.create(
                    user=request.user,
                    chapter=chapter,
                    price=price,
                    idempotency_key=idempotency_key,
                    currency=price.currency,
                    amount_minor=price.amount_minor,
                )
        except IntegrityError:
            existing = NexversePurchase.objects.filter(
                user=request.user, idempotency_key=idempotency_key
            ).select_related("chapter").first()
            if existing and existing.chapter_id == chapter.id:
                return Response({"item": _purchase_payload(existing)}, status=200)
            return Response({"detail": "Purchase intent conflicts with an existing idempotency key."}, status=409)

        return Response({"item": _purchase_payload(purchase)}, status=status.HTTP_201_CREATED)


class NexverseEntitlementListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entitlements = (
            NexverseEntitlement.objects.filter(
                user=request.user,
                status=NexverseEntitlement.Status.ACTIVE,
                purchase__status=NexversePurchase.Status.PAID,
                deleted_at__isnull=True,
            )
            .select_related("work", "chapter")
            .order_by("-created_at")[:200]
        )
        return Response({
            "items": [{
                "id": str(item.id),
                "workId": str(item.work_id),
                "workTitle": item.work.title,
                "chapterId": str(item.chapter_id),
                "chapterNumber": item.chapter.chapter_number,
                "chapterTitle": item.chapter.title,
                "startsAt": item.starts_at.isoformat(),
                "expiresAt": item.expires_at.isoformat() if item.expires_at else None,
            } for item in entitlements]
        })
