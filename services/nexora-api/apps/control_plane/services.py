from __future__ import annotations

from django.conf import settings
from django.utils import timezone

from apps.identity.models import IdentityProviderAccount, NexoraUser
from infrastructure.firebase.registry import FirebaseProviderRegistry
from apps.identity.services import IdentityService

from .models import ControlPlanePrincipal


class ControlPlaneAccessDenied(Exception):
    pass


def _bootstrap_emails() -> set[str]:
    return {
        value.strip().lower()
        for value in getattr(settings, "CONTROL_PLANE_BOOTSTRAP_EMAILS", [])
        if value.strip()
    }


def authenticate_control_plane_token(token: str) -> NexoraUser:
    provider = FirebaseProviderRegistry().identity()
    claims = provider.verify_token(token)

    if not claims.email or not claims.email_verified:
        raise ControlPlaneAccessDenied("A verified email identity is required.")

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
        if claims.email.lower() not in _bootstrap_emails():
            raise ControlPlaneAccessDenied("This identity is not authorized for Control Center.")
        user = IdentityService(provider).reconcile_claims(claims)
    else:
        user = account.user

    if user.status != NexoraUser.Status.ACTIVE or user.deleted_at is not None:
        raise ControlPlaneAccessDenied("The NEXORA identity is not active.")

    try:
        principal = user.control_plane_principal
    except ControlPlanePrincipal.DoesNotExist:
        if (user.email or "").lower() not in _bootstrap_emails():
            raise ControlPlaneAccessDenied("This identity is not authorized for Control Center.")
        principal = ControlPlanePrincipal.objects.create(user=user)

    if not principal.enabled or principal.deleted_at is not None:
        raise ControlPlaneAccessDenied("This Control Center identity is disabled.")

    principal.last_authenticated_at = timezone.now()
    principal.save(update_fields=["last_authenticated_at", "updated_at"])
    return user
