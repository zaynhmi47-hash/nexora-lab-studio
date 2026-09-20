from __future__ import annotations

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.identity.models import IdentityProviderAccount, NexoraUser
from infrastructure.firebase.registry import FirebaseProviderRegistry
from apps.identity.services import IdentityService

from .audit import ControlPlaneAuditEventType, record_control_plane_audit
from .models import ControlPlaneBootstrapState, ControlPlanePrincipal, ControlPlaneRole


class ControlPlaneAccessDenied(Exception):
    pass


def _bootstrap_emails() -> set[str]:
    return {
        value.strip().lower()
        for value in getattr(settings, "CONTROL_PLANE_BOOTSTRAP_EMAILS", [])
        if value and value.strip()
    }


def _bootstrap_allowed(email: str) -> bool:
    return email.strip().lower() in _bootstrap_emails()


def _bootstrap_first_owner(user: NexoraUser) -> ControlPlanePrincipal:
    """Create the sole initial owner, then permanently close login-time bootstrap."""
    with transaction.atomic():
        state = ControlPlaneBootstrapState.objects.select_for_update().get(pk=1)
        if state.locked:
            record_control_plane_audit(
                event_type=ControlPlaneAuditEventType.BOOTSTRAP_REJECTED,
                target=user,
                success=False,
                metadata={"reason": "bootstrap_locked"},
            )
            raise ControlPlaneAccessDenied(
                "Control Center bootstrap is locked. An existing owner must grant access."
            )

        existing_principals = ControlPlanePrincipal.objects.filter(deleted_at__isnull=True).exists()
        if existing_principals:
            state.locked = True
            state.locked_at = timezone.now()
            state.save(update_fields=["locked", "locked_at"])
            record_control_plane_audit(
                event_type=ControlPlaneAuditEventType.BOOTSTRAP_REJECTED,
                target=user,
                success=False,
                metadata={"reason": "existing_principal"},
            )
            raise ControlPlaneAccessDenied(
                "Control Center bootstrap is already initialized."
            )

        principal = ControlPlanePrincipal.objects.create(
            user=user,
            role=ControlPlaneRole.OWNER,
            enabled=True,
        )
        state.locked = True
        state.locked_at = timezone.now()
        state.save(update_fields=["locked", "locked_at"])
        record_control_plane_audit(
            event_type=ControlPlaneAuditEventType.BOOTSTRAP_COMPLETED,
            actor=user,
            target=user,
            metadata={"role": ControlPlaneRole.OWNER},
        )
        return principal


def authenticate_control_plane_token(token: str) -> NexoraUser:
    provider = FirebaseProviderRegistry().identity()
    claims = provider.verify_token(token)

    if not claims.email or not claims.email_verified:
        raise ControlPlaneAccessDenied("A verified email identity is required.")

    email = claims.email.strip().lower()
    account = (
        IdentityProviderAccount.objects
        .select_related("user")
        .filter(
            provider=claims.provider,
            provider_subject=claims.provider_subject,
            deleted_at__isnull=True,
        )
        .first()
    )

    if account is None:
        if not _bootstrap_allowed(email):
            raise ControlPlaneAccessDenied("This identity is not authorized for Control Center.")
        user = IdentityService(provider).reconcile_claims(claims)
    else:
        user = account.user

    if user.status != NexoraUser.Status.ACTIVE or user.deleted_at is not None:
        raise ControlPlaneAccessDenied("The NEXORA identity is not active.")

    try:
        principal = user.control_plane_principal
    except ControlPlanePrincipal.DoesNotExist:
        if not _bootstrap_allowed(user.email or ""):
            raise ControlPlaneAccessDenied("This identity is not authorized for Control Center.")
        principal = _bootstrap_first_owner(user)

    if not principal.enabled or principal.deleted_at is not None:
        raise ControlPlaneAccessDenied("This Control Center identity is disabled.")

    principal.last_authenticated_at = timezone.now()
    principal.save(update_fields=["last_authenticated_at", "updated_at"])
    record_control_plane_audit(
        event_type=ControlPlaneAuditEventType.LOGIN,
        actor=user,
        target=user,
        metadata={"role": principal.role},
    )
    return user


class ControlPlaneRoleManagementError(Exception):
    pass


def manage_control_plane_principal(
    *,
    actor: ControlPlanePrincipal,
    target_user_id: str,
    role: str | None = None,
    enabled: bool | None = None,
) -> ControlPlanePrincipal:
    """Apply an owner-only authorization change with last-owner protection."""
    if actor.role != ControlPlaneRole.OWNER or not actor.enabled or actor.deleted_at is not None:
        raise ControlPlaneRoleManagementError("Only an active Control Center owner may manage principals.")
    if role is not None and role not in ControlPlaneRole.values:
        raise ControlPlaneRoleManagementError("Invalid Control Center role.")
    if role == ControlPlaneRole.OWNER and target_user_id == str(actor.user_id):
        raise ControlPlaneRoleManagementError("The acting owner cannot change their own owner role.")

    with transaction.atomic():
        target = (
            ControlPlanePrincipal.objects.select_for_update()
            .select_related("user")
            .filter(user_id=target_user_id)
            .first()
        )
        if target is None:
            raise ControlPlaneRoleManagementError("Control Center principal not found.")

        next_role = role if role is not None else target.role
        next_enabled = enabled if enabled is not None else target.enabled
        remains_owner = next_role == ControlPlaneRole.OWNER and next_enabled and target.deleted_at is None
        if target.role == ControlPlaneRole.OWNER and target.enabled and not remains_owner:
            owner_count = (
                ControlPlanePrincipal.objects.select_for_update()
                .filter(role=ControlPlaneRole.OWNER, enabled=True, deleted_at__isnull=True)
                .exclude(pk=target.pk)
                .count()
            )
            if owner_count < 1:
                raise ControlPlaneRoleManagementError("At least one active Control Center owner must remain.")

        previous_role = target.role
        previous_enabled = target.enabled
        target.role = next_role
        target.enabled = next_enabled
        target.save(update_fields=["role", "enabled", "updated_at"])

        if previous_role != next_role:
            record_control_plane_audit(
                event_type=ControlPlaneAuditEventType.PRINCIPAL_ROLE_CHANGED,
                actor=actor.user,
                target=target.user,
                metadata={"role_before": previous_role, "role_after": next_role},
            )
        if previous_enabled != next_enabled:
            record_control_plane_audit(
                event_type=(
                    ControlPlaneAuditEventType.PRINCIPAL_ENABLED
                    if next_enabled
                    else ControlPlaneAuditEventType.PRINCIPAL_DISABLED
                ),
                actor=actor.user,
                target=target.user,
                metadata={"enabled_before": previous_enabled, "enabled_after": next_enabled},
            )
        return target
