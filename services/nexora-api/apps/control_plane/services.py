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
    user = IdentityService(FirebaseProviderRegistry().identity()).authenticate_token(token)
    account = (
        IdentityProviderAccount.objects
        .filter(user=user, provider="firebase", deleted_at__isnull=True)
        .order_by("-last_verified_at")
        .first()
    )
    if account is None or not account.email_verified:
        raise ControlPlaneAccessDenied("A verified identity is required.")

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
