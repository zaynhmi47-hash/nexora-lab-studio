from __future__ import annotations

from datetime import datetime, timezone as datetime_timezone
from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import AuthenticationException
from apps.identity.models import IdentityDevice, IdentityLoginEvent, IdentityProviderAccount, NexoraUser
from apps.identity.services.device_security import fingerprint_hash
from infrastructure.identity.ports.identity_provider import IdentityClaims, IdentityProvider


class IdentityService:
    """Reconcile verified provider claims into the internal NEXORA identity graph."""

    def __init__(self, provider: IdentityProvider):
        self.provider = provider

    def authenticate_token(self, token: str, *, device_id: str | None = None) -> NexoraUser:
        claims = self.provider.verify_token(token)
        return self.reconcile_claims(claims, device_id=device_id)

    @transaction.atomic
    def reconcile_claims(self, claims: IdentityClaims, *, device_id: str | None = None) -> NexoraUser:
        account = (
            IdentityProviderAccount.objects.select_for_update()
            .select_related("user")
            .filter(provider=claims.provider, provider_subject=claims.provider_subject)
            .first()
        )
        if account is None:
            user = NexoraUser.objects.create(
                email=claims.email,
                display_name=claims.display_name or "",
                status=NexoraUser.Status.ACTIVE,
            )
            account = IdentityProviderAccount.objects.create(
                user=user,
                provider=claims.provider,
                provider_subject=claims.provider_subject,
            )
        else:
            user = account.user
            if user.deleted_at is not None or user.status in {
                NexoraUser.Status.DISABLED,
                NexoraUser.Status.DELETED,
            }:
                raise AuthenticationException("The NEXORA identity is not active.")
            if account.deleted_at is not None:
                account.restore()

        if user.status != NexoraUser.Status.ACTIVE:
            raise AuthenticationException("The NEXORA identity is not active.")

        account.email = claims.email
        account.email_verified = claims.email_verified
        account.display_name = claims.display_name or ""
        account.claims = dict(claims.claims)
        account.last_verified_at = timezone.now()
        account.save(
            update_fields=[
                "email",
                "email_verified",
                "display_name",
                "claims",
                "last_verified_at",
                "updated_at",
            ]
        )
        changed_fields: list[str] = []
        if claims.email and user.email != claims.email:
            user.email = claims.email
            changed_fields.append("email")
        if claims.display_name and user.display_name != claims.display_name:
            user.display_name = claims.display_name
            changed_fields.append("display_name")
        if changed_fields:
            changed_fields.append("updated_at")
            user.save(update_fields=changed_fields)

        auth_time = claims.claims.get("auth_time")
        try:
            auth_timestamp = int(auth_time)
        except (TypeError, ValueError):
            auth_timestamp = None
        if auth_timestamp is not None and auth_timestamp > 0:
            login_device = None
            if device_id:
                try:
                    digest = fingerprint_hash(device_id)
                    login_device = IdentityDevice.objects.filter(
                        user=user,
                        fingerprint_hash=digest,
                        revoked_at__isnull=True,
                        deleted_at__isnull=True,
                    ).first()
                except ValueError:
                    login_device = None
            already_recorded = IdentityLoginEvent.objects.filter(
                user=user,
                event_type=IdentityLoginEvent.Type.LOGIN_VERIFIED,
                metadata__auth_time=auth_timestamp,
            ).exists()
            if not already_recorded:
                occurred_at = datetime.fromtimestamp(auth_timestamp, tz=datetime_timezone.utc)
                IdentityLoginEvent.objects.create(
                    user=user,
                    device=login_device,
                    event_type=IdentityLoginEvent.Type.LOGIN_VERIFIED,
                    occurred_at=occurred_at,
                    metadata={
                        "provider": claims.provider,
                        "auth_time": auth_timestamp,
                        "sign_in_provider": (claims.claims.get("firebase") or {}).get("sign_in_provider"),
                    },
                )
                if user.last_login_at is None or occurred_at > user.last_login_at:
                    user.last_login_at = occurred_at
                    user.save(update_fields=["last_login_at", "updated_at"])
        return user
