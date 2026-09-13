import pytest

from apps.core.exceptions import AuthenticationException
from apps.identity.models import IdentityProviderAccount, NexoraUser
from apps.identity.services.identity_service import IdentityService
from infrastructure.identity.ports.identity_provider import IdentityClaims


class FakeIdentityProvider:
    def verify_token(self, token: str) -> IdentityClaims:
        return IdentityClaims(
            provider="firebase",
            provider_subject=token,
            email="user@example.com",
            email_verified=True,
            display_name="User",
            claims={"role": "member"},
        )

    def revoke_session(self, provider_subject: str) -> None:
        return None


@pytest.mark.django_db
def test_reconcile_claims_is_idempotent_for_same_provider_subject():
    service = IdentityService(FakeIdentityProvider())
    first = service.authenticate_token("firebase-user-1")
    second = service.authenticate_token("firebase-user-1")

    assert first.id == second.id
    assert NexoraUser.objects.count() == 1
    assert IdentityProviderAccount.objects.count() == 1


@pytest.mark.django_db
def test_reconcile_claims_updates_verified_profile_data():
    service = IdentityService(FakeIdentityProvider())
    user = service.authenticate_token("firebase-user-1")

    assert user.status == NexoraUser.Status.ACTIVE
    assert user.email == "user@example.com"
    assert user.display_name == "User"

    account = user.provider_accounts.get(provider="firebase")
    assert account.email_verified is True
    assert account.claims == {"role": "member"}
    assert account.last_verified_at is not None


@pytest.mark.django_db
def test_reconcile_claims_rejects_disabled_internal_identity():
    service = IdentityService(FakeIdentityProvider())
    user = service.authenticate_token("firebase-user-1")
    user.status = NexoraUser.Status.DISABLED
    user.save(update_fields=["status", "updated_at"])

    with pytest.raises(AuthenticationException):
        service.authenticate_token("firebase-user-1")


@pytest.mark.django_db
def test_reconcile_claims_restores_soft_deleted_provider_account():
    service = IdentityService(FakeIdentityProvider())
    user = service.authenticate_token("firebase-user-1")
    account = user.provider_accounts.get(provider="firebase")
    account.soft_delete()

    authenticated = service.authenticate_token("firebase-user-1")

    assert authenticated.id == user.id
    assert IdentityProviderAccount.objects.get(pk=account.pk).deleted_at is None
