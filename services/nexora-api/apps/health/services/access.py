from django.db.models import Q
from django.utils import timezone

from apps.health.models import HealthConsent, HealthProfile, HealthProfileMember


def can_access_profile(*, actor, profile: HealthProfile, scope: str) -> bool:
    """Fail-closed authorization for health-profile resources."""
    if not getattr(actor, "is_authenticated", False):
        return False
    if getattr(actor, "status", None) != "active":
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
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).first()
    if membership is None or scope not in membership.scopes:
        return False

    consents = HealthConsent.objects.filter(
        profile=profile,
        subject_id=profile.owner_id,
        grantee=actor,
        purpose="delegated_health_access",
        status=HealthConsent.Status.GRANTED,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
        granted_at__lte=now,
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))

    # Evaluate JSON scopes in Python for SQLite compatibility in local tests.
    return any(scope in consent.scopes for consent in consents.only("scopes"))
