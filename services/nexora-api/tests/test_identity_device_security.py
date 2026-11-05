import time
from unittest.mock import Mock, patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.identity.models import IdentityDevice, IdentityLoginEvent, IdentityProviderAccount, NexoraUser
from apps.identity.services.device_security import fingerprint_hash, mark_device_trusted, register_device
from apps.identity.services import IdentityService
from infrastructure.identity.ports.identity_provider import IdentityClaims
from infrastructure.firebase.providers.identity import FirebaseIdentityProvider


@pytest.mark.django_db
def test_device_identifier_is_hashed_and_never_persisted_raw():
    user = NexoraUser.objects.create(email="device@example.com", status=NexoraUser.Status.ACTIVE)
    raw_device_id = "device-id-that-is-long-enough-123"
    device = register_device(
        user=user, device_id=raw_device_id, display_name="Pixel phone", platform="android"
    )

    assert device.fingerprint_hash == fingerprint_hash(raw_device_id)
    assert raw_device_id not in device.fingerprint_hash
    assert device.display_name == "Pixel phone"
    assert IdentityLoginEvent.objects.filter(
        user=user, event_type=IdentityLoginEvent.Type.DEVICE_REGISTERED
    ).exists()
    user.refresh_from_db()
    assert user.last_login_at is not None


@pytest.mark.django_db
def test_revoked_device_cannot_be_registered_again_with_same_identifier():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    raw_device_id = "device-id-that-is-long-enough-456"
    device = register_device(user=user, device_id=raw_device_id)
    device.revoked_at = device.created_at
    device.save(update_fields=["revoked_at"])

    with pytest.raises(ValueError):
        register_device(user=user, device_id=raw_device_id)


@pytest.mark.django_db
def test_trusted_device_requires_service_to_receive_owned_active_device():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    device = register_device(user=user, device_id="device-id-that-is-long-enough-789")
    trusted = mark_device_trusted(user=user, device=device)

    assert trusted.trusted_at is not None
    assert IdentityLoginEvent.objects.filter(
        user=user, event_type=IdentityLoginEvent.Type.DEVICE_TRUSTED
    ).exists()


def test_firebase_token_verification_checks_revocation():
    auth_client = Mock()
    auth_client.verify_id_token.return_value = {
        "uid": "firebase-user-1",
        "auth_time": int(time.time()),
        "email": "user@example.com",
    }
    provider = FirebaseIdentityProvider(auth_client=auth_client)

    claims = provider.verify_token("valid-token")

    assert claims.provider_subject == "firebase-user-1"
    auth_client.verify_id_token.assert_called_once_with(
        "valid-token", app=None, check_revoked=True
    )


@pytest.mark.django_db
def test_device_management_api_only_lists_the_authenticated_users_devices():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    other_user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    own_device = register_device(user=user, device_id="my-device-identifier-long-enough")
    register_device(user=other_user, device_id="other-device-identifier-long-enough")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(reverse("identity-devices"))

    assert response.status_code == 200
    assert [item["id"] for item in response.data["items"]] == [str(own_device.id)]


@pytest.mark.django_db
def test_trusting_device_requires_recent_firebase_reauthentication():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    device = register_device(user=user, device_id="trust-device-identifier-long-enough")
    IdentityProviderAccount.objects.create(
        user=user,
        provider="firebase",
        provider_subject="firebase-user-trust",
        claims={"auth_time": int(time.time()) - 3600},
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(reverse("identity-device-trust", kwargs={"device_id": device.id}))

    assert response.status_code == 403
    device.refresh_from_db()
    assert device.trusted_at is None


@pytest.mark.django_db
def test_revoking_one_device_revokes_all_firebase_sessions():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    device = register_device(user=user, device_id="revoke-device-identifier-long-enough")
    IdentityProviderAccount.objects.create(
        user=user, provider="firebase", provider_subject="firebase-user-revoke"
    )
    client = APIClient()
    client.force_authenticate(user=user)

    with patch("apps.identity.api.security.FirebaseProviderRegistry") as registry:
        registry.return_value.identity.return_value.revoke_session.return_value = None
        response = client.post(
            reverse("identity-device-revoke", kwargs={"device_id": device.id})
        )

    assert response.status_code == 200
    assert response.data["scope"] == "all_firebase_sessions"
    registry.return_value.identity.return_value.revoke_session.assert_called_once_with(
        "firebase-user-revoke"
    )
    device.refresh_from_db()
    assert device.revoked_at is not None


@pytest.mark.django_db
def test_trusting_device_succeeds_after_recent_firebase_reauthentication():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    device = register_device(user=user, device_id="recent-auth-device-identifier")
    IdentityProviderAccount.objects.create(
        user=user,
        provider="firebase",
        provider_subject="firebase-user-recent",
        claims={"auth_time": int(time.time())},
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(reverse("identity-device-trust", kwargs={"device_id": device.id}))

    assert response.status_code == 200
    assert response.data["data"]["trusted_at"] is not None


@pytest.mark.django_db
def test_failed_provider_revocation_does_not_mark_device_revoked():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    device = register_device(user=user, device_id="provider-fail-device-identifier")
    IdentityProviderAccount.objects.create(
        user=user, provider="firebase", provider_subject="firebase-user-fail"
    )
    client = APIClient()
    client.force_authenticate(user=user)

    with patch("apps.identity.api.security.FirebaseProviderRegistry") as registry:
        registry.return_value.identity.return_value.revoke_session.side_effect = RuntimeError("provider down")
        response = client.post(
            reverse("identity-device-revoke", kwargs={"device_id": device.id})
        )

    assert response.status_code == 503
    device.refresh_from_db()
    assert device.revoked_at is None


@pytest.mark.django_db
def test_verified_firebase_login_is_recorded_once_per_auth_time_and_linked_to_device():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE)
    raw_device_id = "login-event-device-identifier"
    device = register_device(user=user, device_id=raw_device_id)
    provider = Mock()
    provider.verify_token.return_value = IdentityClaims(
        provider="firebase",
        provider_subject="firebase-login-history-user",
        email="login@example.com",
        claims={"auth_time": int(time.time()), "firebase": {"sign_in_provider": "password"}},
    )
    service = IdentityService(provider)

    service.authenticate_token("id-token", device_id=raw_device_id)
    service.authenticate_token("id-token", device_id=raw_device_id)

    events = IdentityLoginEvent.objects.filter(
        user=user, event_type=IdentityLoginEvent.Type.LOGIN_VERIFIED
    )
    assert events.count() == 1
    assert events.first().device_id == device.id
