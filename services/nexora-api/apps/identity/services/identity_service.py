from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import AuthenticationException
from apps.identity.models import IdentityProviderAccount, NexoraUser
from infrastructure.identity.ports.identity_provider import IdentityClaims, IdentityProvider


class IdentityService:
    """Reconcile verified provider claims into the internal NEXORA identity graph."""

    def __init__(self, provider: IdentityProvider):
        self.provider = provider

    def authenticate_token(self, token: str) -> NexoraUser:
        claims = self.provider.verify_token(token)
        return self.reconcile_claims(claims)

    @transaction.atomic
    def reconcile_claims(self, claims: IdentityClaims) -> NexoraUser:
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
        return user
