import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.health.models import HealthAccessAuditEvent, HealthProfile
from apps.health.services.access_grants import grant_profile_access
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(email=email, status=NexoraUser.Status.ACTIVE)


def record_payload(**overrides):
    payload = {
        "record_type": "clinical_note",
        "title": "Consultation note",
        "description": "Patient-reported headache; not a confirmed diagnosis.",
        "occurred_at": timezone.now().isoformat(),
        "source_type": "patient_reported",
        "source_name": "Self report",
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
def test_owner_can_create_list_read_and_update_medical_record_with_audit():
    owner = make_user("records-owner@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="My Health")
    client = APIClient()
    client.force_authenticate(user=owner)

    created = client.post(
        f"/api/v1/health/profiles/{profile.pk}/records/",
        record_payload(),
        format="json",
    )
    assert created.status_code == 201
    record_id = created.data["data"]["id"]
    assert created.data["data"]["verificationStatus"] == "unverified"

    detail = client.get(f"/api/v1/health/profiles/{profile.pk}/records/{record_id}/")
    assert detail.status_code == 200
    assert detail.data["data"]["title"] == "Consultation note"

    listing = client.get(f"/api/v1/health/profiles/{profile.pk}/records/")
    assert listing.status_code == 200
    assert len(listing.data["data"]) == 1

    updated = client.patch(
        f"/api/v1/health/profiles/{profile.pk}/records/{record_id}/",
        {"title": "Updated consultation note"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["data"]["title"] == "Updated consultation note"
    actions = HealthAccessAuditEvent.objects.filter(profile=profile).values_list("action", flat=True)
    assert actions.count() == 4
    assert set(actions) == {"record.created", "record.read", "record.updated"}


@pytest.mark.django_db
def test_delegated_read_and_write_require_independent_scopes():
    owner = make_user("records-owner@example.com")
    viewer = make_user("records-viewer@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Shared Health")
    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=viewer.pk,
        scopes=["records.read"], policy_version="v1",
    )
    client = APIClient()
    client.force_authenticate(user=viewer)

    denied = client.post(
        f"/api/v1/health/profiles/{profile.pk}/records/",
        record_payload(),
        format="json",
    )
    assert denied.status_code == 404

    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=viewer.pk,
        scopes=["records.read", "records.write"], policy_version="v2",
    )
    created = client.post(
        f"/api/v1/health/profiles/{profile.pk}/records/",
        record_payload(),
        format="json",
    )
    assert created.status_code == 201


@pytest.mark.django_db
def test_unrelated_user_cannot_enumerate_medical_records():
    owner = make_user("records-owner@example.com")
    stranger = make_user("records-stranger@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private")
    client = APIClient()
    client.force_authenticate(user=stranger)

    response = client.get(f"/api/v1/health/profiles/{profile.pk}/records/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_only_profile_owner_can_mark_record_verified():
    owner = make_user("records-owner@example.com")
    caregiver = make_user("records-caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Shared")
    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
        scopes=["records.read", "records.write"], policy_version="v1",
    )
    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    created = owner_client.post(
        f"/api/v1/health/profiles/{profile.pk}/records/", record_payload(), format="json",
    )
    record_id = created.data["data"]["id"]

    caregiver_client = APIClient()
    caregiver_client.force_authenticate(user=caregiver)
    create_with_status = caregiver_client.post(
        f"/api/v1/health/profiles/{profile.pk}/records/",
        record_payload(verification_status="unverified"),
        format="json",
    )
    assert create_with_status.status_code == 403

    response = caregiver_client.patch(
        f"/api/v1/health/profiles/{profile.pk}/records/{record_id}/",
        {"verification_status": "verified"},
        format="json",
    )
    assert response.status_code == 403
