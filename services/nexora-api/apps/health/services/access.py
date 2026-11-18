from django.utils import timezone

from apps.health.models import HealthConsent, HealthProfile, HealthProfileMember


def can_access_profile(*, actor, profile: HealthProfile, scope: str) -> bool:
    """Fail-closed authorization for health-profile resources."""
    if not getattr(actor, "is_authenticated", False):
        return False
    if profile.deleted_at is not None or profile.status != HealthProfile.Status.ACTIVE:
        return False
    if profile.owner_id == actor.pk:
        return True

    now = timezone.now()
    membership = HealthProfileMember.objects.filter(
        profile=profile,
        user=actor,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    ).filter(
        # Null expiry means no scheduled expiry.
    ).first()
    if membership is None or (membership.expires_at and membership.expires_at <= now):
        return False
    if scope not in membership.scopes:
        return False

    return HealthConsent.objects.filter(
        profile=profile,
        subject=profile.owner,
        grantee=actor,
        purpose="delegated_health_access",
        status=HealthConsent.Status.GRANTED,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    ).filter(
        granted_at__lte=now,
    ).filter(
        models_expiry_filter(now)
    ).filter(
        scopes__contains=[scope]
    ).exists()


def models_expiry_filter(now):
    from django.db.models import Q
    return Q(expires_at__isnull=True) | Q(expires_at__gt=now)
