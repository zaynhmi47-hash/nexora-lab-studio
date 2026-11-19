import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.health.models import HealthAccessAuditEvent, HealthConsent, HealthProfile, HealthProfileMember
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(email=email, status=NexoraUser.Status.ACTIVE)


@pytest.mark.django_db
def test_profile_owner_can_create_list_and_read_profile_with_audit():
    owner = make_user("health-owner@example.com")
    client = APIClient()
    client.force_authenticate(user=owner)

    created = client.post(
        "/api/v1/health/profiles/",
        {"display_name": "My Health", "date_of_birth": "1998-04-12"},
        format="json",
    )
    assert created.status_code == 201
    profile_id = created.data["data"]["id"]
    assert HealthAccessAuditEvent.objects.filter(
        profile_id=profile_id,
        action=HealthAccessAuditEvent.Action.PROFILE_CREATED,
        actor=owner,
    ).count() == 1

    detail = client.get(f"/api/v1/health/profiles/{profile_id}/")
    assert detail.status_code == 200
    assert detail.data["data"]["displayName"] == "My Health"

    listing = client.get("/api/v1/health/profiles/")
    assert listing.status_code == 200
    assert len(listing.data["data"]) == 1
    assert HealthAccessAuditEvent.objects.filter(
        profile_id=profile_id,
        action=HealthAccessAuditEvent.Action.PROFILE_READ,
        actor=owner,
    ).count() == 2


@pytest.mark.django_db
def test_private_profile_is_not_disclosed_to_unrelated_user():
    owner = make_user("health-owner@example.com")
    stranger = make_user("health-stranger@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private")

    client = APIClient()
    client.force_authenticate(user=stranger)
    response = client.get(f"/api/v1/health/profiles/{profile.pk}/")

    assert response.status_code == 404
    assert HealthAccessAuditEvent.objects.filter(profile=profile).count() == 0


@pytest.mark.django_db
def test_delegated_profile_read_requires_scope_and_creates_read_audit():
    owner = make_user("health-owner@example.com")
    caregiver = make_user("health-caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Family Health")
    HealthProfileMember.objects.create(
        profile=profile, user=caregiver, granted_by=owner, scopes=["profile.read"],
    )
    HealthConsent.objects.create(
        profile=profile, subject=owner, grantee=caregiver,
        purpose="delegated_health_access", scopes=["profile.read"],
        policy_version="v1", status=HealthConsent.Status.GRANTED,
        granted_at=timezone.now(),
    )

    client = APIClient()
    client.force_authenticate(user=caregiver)
    response = client.get(f"/api/v1/health/profiles/{profile.pk}/")

    assert response.status_code == 200
    assert HealthAccessAuditEvent.objects.filter(
        profile=profile, actor=caregiver,
        action=HealthAccessAuditEvent.Action.PROFILE_READ,
    ).exists()


@pytest.mark.django_db
def test_owner_can_grant_and_grantee_can_revoke_via_api():
    owner = make_user("health-owner@example.com")
    caregiver = make_user("health-caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Family Health")

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    granted = owner_client.post(
        f"/api/v1/health/profiles/{profile.pk}/access-grants/",
        {
            "grantee_id": str(caregiver.pk),
            "scopes": ["profile.read"],
            "policy_version": "v1",
            "role": "caregiver",
        },
        format="json",
    )
    assert granted.status_code == 201

    caregiver_client = APIClient()
    caregiver_client.force_authenticate(user=caregiver)
    assert caregiver_client.get(f"/api/v1/health/profiles/{profile.pk}/").status_code == 200

    revoked = caregiver_client.delete(
        f"/api/v1/health/profiles/{profile.pk}/access-grants/",
        {"grantee_id": str(caregiver.pk)},
        format="json",
    )
    assert revoked.status_code == 200
    assert revoked.data["data"]["revoked"] is True
    assert caregiver_client.get(f"/api/v1/health/profiles/{profile.pk}/").status_code == 404
