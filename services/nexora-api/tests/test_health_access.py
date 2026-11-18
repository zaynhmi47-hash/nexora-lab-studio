from datetime import timedelta

import pytest
from django.utils import timezone

from apps.health.models import HealthConsent, HealthProfile, HealthProfileMember
from apps.health.services.access import can_access_profile
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(email=email, status=NexoraUser.Status.ACTIVE)


@pytest.mark.django_db
def test_profile_owner_can_access_own_profile():
    owner = make_user("owner@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="My Health")

    assert can_access_profile(actor=owner, profile=profile, scope="records.read") is True


@pytest.mark.django_db
def test_unrelated_user_is_denied_by_default():
    owner = make_user("owner@example.com")
    stranger = make_user("stranger@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")

    assert can_access_profile(actor=stranger, profile=profile, scope="records.read") is False


@pytest.mark.django_db
def test_delegated_access_requires_membership_and_matching_consent():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Family Health")
    HealthProfileMember.objects.create(
        profile=profile, user=caregiver, granted_by=owner,
        role=HealthProfileMember.Role.CAREGIVER, scopes=["records.read"],
    )

    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read") is False

    HealthConsent.objects.create(
        profile=profile, subject=owner, grantee=caregiver,
        purpose="delegated_health_access", scopes=["records.read"],
        policy_version="2026-01", status=HealthConsent.Status.GRANTED,
        granted_at=timezone.now(),
    )
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read") is True
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.write") is False


@pytest.mark.django_db
def test_revoked_consent_denies_previously_delegated_access():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")
    HealthProfileMember.objects.create(
        profile=profile, user=caregiver, granted_by=owner,
        scopes=["records.read"],
    )
    consent = HealthConsent.objects.create(
        profile=profile, subject=owner, grantee=caregiver,
        purpose="delegated_health_access", scopes=["records.read"],
        policy_version="2026-01", granted_at=timezone.now(),
    )
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read") is True

    consent.status = HealthConsent.Status.REVOKED
    consent.revoked_at = timezone.now()
    consent.save(update_fields=["status", "revoked_at", "updated_at"])
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read") is False


@pytest.mark.django_db
def test_expired_membership_denies_access_even_with_consent():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")
    HealthProfileMember.objects.create(
        profile=profile, user=caregiver, granted_by=owner,
        scopes=["records.read"], expires_at=timezone.now() - timedelta(seconds=1),
    )
    HealthConsent.objects.create(
        profile=profile, subject=owner, grantee=caregiver,
        purpose="delegated_health_access", scopes=["records.read"],
        policy_version="2026-01", granted_at=timezone.now() - timedelta(days=1),
    )

    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read") is False
