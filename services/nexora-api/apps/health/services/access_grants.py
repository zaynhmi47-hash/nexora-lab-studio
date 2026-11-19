from __future__ import annotations

from datetime import datetime
from typing import Iterable

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from apps.core.context import get_request_context
from apps.health.models import HealthAccessAuditEvent, HealthConsent, HealthProfile, HealthProfileMember
from apps.identity.models import NexoraUser


DELEGATED_ACCESS_PURPOSE = "delegated_health_access"
MAX_SCOPES_PER_GRANT = 20


def _require_active_actor(actor: NexoraUser) -> None:
    if not getattr(actor, "is_authenticated", False) or actor.status != NexoraUser.Status.ACTIVE:
        raise PermissionDenied("An active Nexora identity is required.")


def _normalize_scopes(scopes: Iterable[str]) -> list[str]:
    if isinstance(scopes, (str, bytes)):
        raise ValidationError({"scopes": "Provide a list of scope strings, not a single string."})
    values = list(scopes)
    if not values or len(values) > MAX_SCOPES_PER_GRANT:
        raise ValidationError({"scopes": f"Provide between 1 and {MAX_SCOPES_PER_GRANT} scopes."})
    if any(not isinstance(scope, str) or not scope or len(scope) > 80 or "." not in scope for scope in values):
        raise ValidationError({"scopes": "Each scope must be a non-empty namespaced string."})
    return sorted(set(values))


def _record_event(*, actor, profile, grantee, action, scopes, policy_version, purpose=DELEGATED_ACCESS_PURPOSE):
    context = get_request_context()
    HealthAccessAuditEvent.objects.create(
        profile=profile,
        actor=actor,
        subject=profile.owner,
        grantee=grantee,
        action=action,
        purpose=purpose,
        scopes=scopes,
        policy_version=policy_version,
        correlation_id=context.correlation_id or "",
    )


@transaction.atomic
def grant_profile_access(
    *,
    actor: NexoraUser,
    profile_id,
    grantee_id,
    scopes: Iterable[str],
    policy_version: str,
    role: str = HealthProfileMember.Role.VIEWER,
    expires_at: datetime | None = None,
) -> tuple[HealthProfileMember, HealthConsent]:
    """Grant scoped access. Only the active profile owner may authorize delegation."""
    _require_active_actor(actor)
    normalized_scopes = _normalize_scopes(scopes)
    if not policy_version or len(policy_version) > 32:
        raise ValidationError({"policy_version": "A valid consent policy version is required."})
    if role not in HealthProfileMember.Role.values or role == HealthProfileMember.Role.OWNER:
        raise ValidationError({"role": "A delegated member must have a non-owner role."})
    now = timezone.now()
    if expires_at is not None and expires_at <= now:
        raise ValidationError({"expires_at": "The access expiry must be in the future."})

    profile = HealthProfile.objects.select_for_update().get(pk=profile_id, deleted_at__isnull=True)
    if profile.status != HealthProfile.Status.ACTIVE:
        raise PermissionDenied("Archived health profiles cannot grant access.")
    if profile.owner_id != actor.pk:
        raise PermissionDenied("Only the health-profile owner may grant access.")

    grantee = NexoraUser.objects.select_for_update().get(pk=grantee_id)
    if grantee.status != NexoraUser.Status.ACTIVE:
        raise PermissionDenied("Access can only be granted to an active Nexora identity.")
    if grantee.pk == profile.owner_id:
        raise ValidationError({"grantee_id": "The profile owner does not need delegated access."})

    member = HealthProfileMember.objects.select_for_update().filter(
        profile=profile, user=grantee, deleted_at__isnull=True
    ).first()
    if member is None:
        member = HealthProfileMember.objects.create(
            profile=profile, user=grantee, granted_by=actor, role=role,
            scopes=normalized_scopes, expires_at=expires_at, revoked_at=None,
        )
    else:
        member.granted_by = actor
        member.role = role
        member.scopes = normalized_scopes
        member.expires_at = expires_at
        member.revoked_at = None
        member.save(update_fields=["granted_by", "role", "scopes", "expires_at", "revoked_at", "updated_at"])

    previous_consents = list(HealthConsent.objects.select_for_update().filter(
        profile=profile,
        subject_id=profile.owner_id,
        grantee=grantee,
        purpose=DELEGATED_ACCESS_PURPOSE,
        status=HealthConsent.Status.GRANTED,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    ))
    if previous_consents:
        previous_scopes = sorted({scope for previous in previous_consents for scope in previous.scopes})
        previous_policy_version = previous_consents[-1].policy_version
        for previous in previous_consents:
            previous.status = HealthConsent.Status.REVOKED
            previous.revoked_at = now
            previous.save(update_fields=["status", "revoked_at", "updated_at"])
        _record_event(
            actor=actor, profile=profile, grantee=grantee,
            action=HealthAccessAuditEvent.Action.ACCESS_REVOKED,
            scopes=previous_scopes, policy_version=previous_policy_version,
        )

    consent = HealthConsent.objects.create(
        profile=profile,
        subject=profile.owner,
        grantee=grantee,
        purpose=DELEGATED_ACCESS_PURPOSE,
        scopes=normalized_scopes,
        policy_version=policy_version,
        status=HealthConsent.Status.GRANTED,
        granted_at=now,
        expires_at=expires_at,
    )
    _record_event(
        actor=actor, profile=profile, grantee=grantee,
        action=HealthAccessAuditEvent.Action.ACCESS_GRANTED,
        scopes=normalized_scopes, policy_version=policy_version,
    )
    return member, consent


@transaction.atomic
def revoke_profile_access(*, actor: NexoraUser, profile_id, grantee_id) -> bool:
    """Revoke delegated access. The owner or the grantee may revoke it."""
    _require_active_actor(actor)
    profile = HealthProfile.objects.select_for_update().get(pk=profile_id, deleted_at__isnull=True)
    if profile.owner_id != actor.pk and str(actor.pk) != str(grantee_id):
        raise PermissionDenied("Only the profile owner or the grantee may revoke this access.")

    member = HealthProfileMember.objects.select_for_update().filter(
        profile=profile,
        user_id=grantee_id,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    ).first()
    if member is None:
        return False

    now = timezone.now()
    consents = HealthConsent.objects.select_for_update().filter(
        profile=profile,
        subject_id=profile.owner_id,
        grantee_id=grantee_id,
        purpose=DELEGATED_ACCESS_PURPOSE,
        status=HealthConsent.Status.GRANTED,
        revoked_at__isnull=True,
        deleted_at__isnull=True,
    )
    latest_policy_version = consents.order_by("-granted_at").values_list("policy_version", flat=True).first() or "unknown"

    member.revoked_at = now
    member.save(update_fields=["revoked_at", "updated_at"])
    for consent in consents:
        consent.status = HealthConsent.Status.REVOKED
        consent.revoked_at = now
        consent.save(update_fields=["status", "revoked_at", "updated_at"])

    _record_event(
        actor=actor,
        profile=profile,
        grantee=member.user,
        action=HealthAccessAuditEvent.Action.ACCESS_REVOKED,
        scopes=list(member.scopes),
        policy_version=latest_policy_version,
    )
    return True
