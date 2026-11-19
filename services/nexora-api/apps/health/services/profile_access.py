from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound

from apps.health.models import HealthAccessAuditEvent, HealthProfile
from apps.health.services.access import can_access_profile
from apps.health.services.access_grants import DELEGATED_ACCESS_PURPOSE
from apps.core.context import get_request_context


PROFILE_READ_SCOPE = "profile.read"


def get_accessible_profile(*, actor, profile_id, scope=PROFILE_READ_SCOPE):
    profile = HealthProfile.objects.filter(
        pk=profile_id,
        deleted_at__isnull=True,
        status=HealthProfile.Status.ACTIVE,
    ).select_related("owner").first()
    if profile is None or not can_access_profile(actor=actor, profile=profile, scope=scope):
        # Do not reveal whether a private profile exists.
        raise NotFound("Health profile is not available.")
    return profile


def get_accessible_profiles(*, actor, scope=PROFILE_READ_SCOPE):
    candidates = HealthProfile.objects.filter(
        deleted_at__isnull=True,
        status=HealthProfile.Status.ACTIVE,
    ).filter(
        Q(owner=actor)
        | Q(
            members__user=actor,
            members__revoked_at__isnull=True,
            members__deleted_at__isnull=True,
        )
    ).select_related("owner").distinct()
    return [profile for profile in candidates if can_access_profile(actor=actor, profile=profile, scope=scope)]


@transaction.atomic
def record_profile_read(*, actor, profile):
    """Persist a sensitive-read audit event in the same request transaction."""
    context = get_request_context()
    HealthAccessAuditEvent.objects.create(
        profile=profile,
        actor=actor,
        subject=profile.owner,
        grantee=actor,
        action=HealthAccessAuditEvent.Action.PROFILE_READ,
        purpose=DELEGATED_ACCESS_PURPOSE,
        scopes=[PROFILE_READ_SCOPE],
        policy_version="health-access-policy-v1",
        correlation_id=context.correlation_id or "",
        details={"resource": "health_profile", "resource_id": str(profile.pk)},
    )
