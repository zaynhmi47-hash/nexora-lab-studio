from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from .models import NexverseEntitlement, NexversePurchase, NexverseRoyaltyEntry


def user_has_chapter_entitlement(user, chapter) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    now = timezone.now()
    return NexverseEntitlement.objects.filter(
        user=user,
        work_id=chapter.work_id,
        chapter=chapter,
        status=NexverseEntitlement.Status.ACTIVE,
        purchase__status=NexversePurchase.Status.PAID,
        starts_at__lte=now,
    ).filter(
        models_expiry_filter(now)
    ).exists()


def models_expiry_filter(now):
    from django.db.models import Q

    return Q(expires_at__isnull=True) | Q(expires_at__gt=now)


@transaction.atomic
def confirm_verified_purchase(*, purchase_id, provider: str, provider_reference: str):
    """Settle a purchase only after a trusted payment adapter verifies its webhook."""
    provider = provider.strip().lower()
    provider_reference = provider_reference.strip()
    if not provider or not provider_reference:
        raise ValueError("A verified provider and provider reference are required.")

    purchase = NexversePurchase.objects.select_for_update().select_related(
        "chapter", "chapter__work"
    ).get(pk=purchase_id)

    if purchase.status == NexversePurchase.Status.PAID:
        if purchase.payment_provider != provider or purchase.provider_reference != provider_reference:
            raise ValueError("Purchase is already settled by a different payment reference.")
        return purchase.entitlement

    if purchase.status != NexversePurchase.Status.PENDING:
        raise ValueError("Only pending purchases can be settled.")

    now = timezone.now()
    purchase.status = NexversePurchase.Status.PAID
    purchase.payment_provider = provider
    purchase.provider_reference = provider_reference
    purchase.paid_at = now
    purchase.save(update_fields=(
        "status", "payment_provider", "provider_reference", "paid_at", "updated_at"
    ))

    entitlement, _ = NexverseEntitlement.objects.get_or_create(
        purchase=purchase,
        defaults={
            "user": purchase.user,
            "work": purchase.chapter.work,
            "chapter": purchase.chapter,
            "status": NexverseEntitlement.Status.ACTIVE,
            "starts_at": now,
        },
    )
    NexverseRoyaltyEntry.objects.get_or_create(
        purchase=purchase,
        entry_type=NexverseRoyaltyEntry.EntryType.CREDIT,
        defaults={
            "author": purchase.chapter.work.author,
            "currency": purchase.currency,
            "amount_minor": purchase.amount_minor,
        },
    )
    return entitlement


@transaction.atomic
def revoke_refunded_purchase(*, purchase_id):
    purchase = NexversePurchase.objects.select_for_update().get(pk=purchase_id)
    if purchase.status == NexversePurchase.Status.REFUNDED:
        return False
    if purchase.status != NexversePurchase.Status.PAID:
        raise ValueError("Only paid purchases can be refunded.")
    purchase.status = NexversePurchase.Status.REFUNDED
    purchase.save(update_fields=("status", "updated_at"))
    NexverseEntitlement.objects.filter(
        purchase=purchase, status=NexverseEntitlement.Status.ACTIVE
    ).update(status=NexverseEntitlement.Status.REVOKED, updated_at=timezone.now())
    credit = NexverseRoyaltyEntry.objects.filter(
        purchase=purchase, entry_type=NexverseRoyaltyEntry.EntryType.CREDIT
    ).first()
    if credit:
        NexverseRoyaltyEntry.objects.get_or_create(
            purchase=purchase,
            entry_type=NexverseRoyaltyEntry.EntryType.REVERSAL,
            defaults={
                "author": credit.author,
                "currency": credit.currency,
                "amount_minor": credit.amount_minor,
            },
        )
    return True
